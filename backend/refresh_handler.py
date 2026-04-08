"""
Scheduled Lambda: fetch Shopify catalog, compare with S3 copy,
re-enrich via Groq if changed, upload updated files to S3.

Triggered by EventBridge on a daily schedule.
"""
import hashlib
import json
import logging
import os
import re
import time

import boto3
import httpx
from groq import Groq

logger = logging.getLogger("coffeeriff.refresh")
logger.setLevel(logging.INFO)

BUCKET = os.environ["DATA_BUCKET"]
SHOPIFY_URL = "https://coffeeriff.com/products.json"
PRODUCTS_KEY = "products.json"
ENRICHED_KEY = "products_enriched.json"

s3 = boto3.client("s3")

ENRICH_SYSTEM_PROMPT = """You are a coffee data extraction tool. Given a list of specialty coffee products,
return a JSON array — one object per product — with EXACTLY these fields:

- handle: (string) exact handle from the input, unchanged
- roast: (string) ONLY "chiara" or "media" — specialty coffees (SCA 85+) are NEVER dark roast.
         Use flavor notes and SCA score to infer: bright/fruity/floral = chiara,
         chocolate/nutty/balanced = media.
- process: (string) one of: "naturale", "lavato", "anaerobico", "naturale-fermentato", "decaf", "altro"
- origin_country: (string) country name in Italian (e.g. "Etiopia", "Colombia", "El Salvador")
- origin_region: (string) region/area, or null if not mentioned
- flavor_notes: (array of 3-5 strings) clean Italian flavor nouns only, no sentences
  (e.g. ["agrumi", "prugna", "caramello"])
- brew_compatibility: (array) subset of ["espresso","filtro","moka"]
  inferred from roast level (chiara = filtro-friendly, media = moka/espresso-friendly)
  and any explicit mentions in the description
- sca_score: (integer) SCA score if mentioned, or null
- bullets: (array of 4-6 short Italian strings) for the product display card:
    index 0: flavor notes joined by commas (e.g. "Agrumi, prugna, caramello")
    index 1: "Processo: ..." (short version)
    index 2: "Origine: Country – Region" (or just country)
    index 3: "Altitudine: X m s.l.m." if mentioned (omit if not)
    index 4: "Varietà: X" if mentioned (omit if not)
    index 5: "SCA: N punti" if score available (omit if not)

Rules:
- Return ONLY a valid JSON array, no markdown fences, no explanation text.
- If a field cannot be determined, use null (not empty string).
- The bullets array must have at least 3 entries (flavor notes, processo, origine)."""


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _strip_html(html: str) -> str:
    text = re.sub(r"<[^>]+>", " ", html)
    text = re.sub(r"&[a-z]+;", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def _catalog_hash(products: list[dict]) -> str:
    key = "|".join(f"{p['handle']}:{p['title']}" for p in products)
    return hashlib.md5(key.encode()).hexdigest()


def _fetch_shopify() -> list[dict]:
    parsed = []
    page = 1
    with httpx.Client(verify=False, timeout=30) as client:
        while True:
            resp = client.get(f"{SHOPIFY_URL}?page={page}&limit=250")
            resp.raise_for_status()
            raw_list = resp.json().get("products", [])
            if not raw_list:
                break
            for raw in raw_list:
                body = _strip_html(raw.get("body_html", ""))
                variant = raw.get("variants", [{}])[0]
                images = raw.get("images", [])
                tags = raw.get("tags", [])
                parsed.append({
                    "title": raw["title"],
                    "handle": raw["handle"],
                    "description": body,
                    "price": variant.get("price", "0.00"),
                    "tags": ", ".join(tags) if isinstance(tags, list) else tags,
                    "image_url": images[0]["src"] if images else "",
                    "images": [img["src"] for img in images],
                    "product_type": raw.get("product_type", ""),
                    "vendor": raw.get("vendor", ""),
                })
            page += 1
    return parsed


# ---------------------------------------------------------------------------
# S3 helpers
# ---------------------------------------------------------------------------

def _read_s3_json(key: str):
    try:
        obj = s3.get_object(Bucket=BUCKET, Key=key)
        return json.loads(obj["Body"].read().decode("utf-8"))
    except s3.exceptions.NoSuchKey:
        return None


def _write_s3_json(key: str, data) -> None:
    s3.put_object(
        Bucket=BUCKET,
        Key=key,
        Body=json.dumps(data, ensure_ascii=False, indent=2).encode("utf-8"),
        ContentType="application/json",
    )


# ---------------------------------------------------------------------------
# Enrichment
# ---------------------------------------------------------------------------

def _enrich_batch(client: Groq, batch: list[dict]) -> list[dict]:
    payload = [
        {
            "handle": p["handle"],
            "title": p["title"],
            "description": p.get("description", "")[:600],
            "tags": p.get("tags", ""),
        }
        for p in batch
    ]

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": ENRICH_SYSTEM_PROMPT},
            {"role": "user", "content": json.dumps(payload, ensure_ascii=False)},
        ],
        temperature=0.1,
        max_tokens=2048,
    )
    raw = response.choices[0].message.content.strip()
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1]
        raw = raw.rsplit("```", 1)[0].strip()
    return json.loads(raw)


def _run_enrichment(products: list[dict]) -> dict[str, dict]:
    """Enrich all products via Groq, return dict keyed by handle."""
    groq_client = Groq(api_key=os.environ["GROQ_API_KEY"])

    enriched = _read_s3_json(ENRICHED_KEY) or {}

    # Filter to coffee products not yet enriched
    coffee_products = [
        p for p in products
        if p.get("product_type", "").lower() in ("caffè", "caffe'", "")
        and "grinder" not in p.get("title", "").lower()
        and "macinacaff" not in p.get("title", "").lower()
    ]
    pending = [p for p in coffee_products if p["handle"] not in enriched]

    if not pending:
        logger.info("All products already enriched.")
        return enriched

    logger.info("Enriching %d new products...", len(pending))
    batch_size = 5
    batches = [pending[i:i + batch_size] for i in range(0, len(pending), batch_size)]

    for i, batch in enumerate(batches):
        handles = [p["handle"] for p in batch]
        logger.info("Batch %d/%d: %s", i + 1, len(batches), handles)
        try:
            results = _enrich_batch(groq_client, batch)
            for item in results:
                handle = item.get("handle")
                if handle:
                    enriched[handle] = {k: v for k, v in item.items() if k != "handle"}
        except Exception as e:
            logger.error("Batch %d failed: %s", i + 1, e)
        if i < len(batches) - 1:
            time.sleep(1)

    return enriched


# ---------------------------------------------------------------------------
# Lambda entry point
# ---------------------------------------------------------------------------

def handler(event, context):
    """Triggered by EventBridge schedule."""
    logger.info("Fetching Shopify catalog...")
    live = _fetch_shopify()

    cached = _read_s3_json(PRODUCTS_KEY)
    if cached and _catalog_hash(live) == _catalog_hash(cached):
        logger.info("Catalog unchanged. No action needed.")
        return {"statusCode": 200, "body": "unchanged"}

    logger.info("Catalog changed — updating S3 and re-enriching...")
    _write_s3_json(PRODUCTS_KEY, live)

    enriched = _run_enrichment(live)
    _write_s3_json(ENRICHED_KEY, enriched)

    logger.info("Refresh complete. %d products, %d enriched.", len(live), len(enriched))
    return {"statusCode": 200, "body": f"updated: {len(live)} products"}
