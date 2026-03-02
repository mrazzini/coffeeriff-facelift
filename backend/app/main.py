import asyncio
import hashlib
import json
import logging
import os
import re
import sys
from pathlib import Path

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from .models import QuizAnswers, QuizConfig, Recommendation
from .recommender import get_recommendations
from .products import load_products, load_enriched, invalidate_cache
from .quiz_config import build_quiz_config

load_dotenv()

logger = logging.getLogger("coffeeriff")
logging.basicConfig(level=logging.INFO)

DATA_DIR = Path(__file__).parent.parent / "data"
PRODUCTS_FILE = DATA_DIR / "products.json"
ENRICHED_FILE = DATA_DIR / "products_enriched.json"
SHOPIFY_URL = "https://coffeeriff.com/products.json"

app = FastAPI(title="Coffeeriff AI Recommender", version="1.0.0")

allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Catalog refresh helpers
# ---------------------------------------------------------------------------

def _strip_html(html: str) -> str:
    text = re.sub(r"<[^>]+>", " ", html)
    text = re.sub(r"&[a-z]+;", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def _catalog_hash(products: list[dict]) -> str:
    key = "|".join(f"{p['handle']}:{p['title']}" for p in products)
    return hashlib.md5(key.encode()).hexdigest()


async def _fetch_shopify() -> list[dict]:
    parsed = []
    page = 1
    async with httpx.AsyncClient(verify=False, timeout=30) as client:
        while True:
            resp = await client.get(f"{SHOPIFY_URL}?page={page}&limit=250")
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
                    "description": body[:500],
                    "price": variant.get("price", "0.00"),
                    "tags": ", ".join(tags) if isinstance(tags, list) else tags,
                    "image_url": images[0]["src"] if images else "",
                    "product_type": raw.get("product_type", ""),
                    "vendor": raw.get("vendor", ""),
                })
            page += 1
    return parsed


async def _run_enrichment() -> None:
    script = Path(__file__).parent.parent / "scripts" / "enrich_products.py"
    proc = await asyncio.create_subprocess_exec(
        sys.executable, str(script),
        cwd=str(Path(__file__).parent.parent),
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout, stderr = await proc.communicate()
    if proc.returncode == 0:
        logger.info("Enrichment complete: %s", stdout.decode().strip().split("\n")[-1])
    else:
        logger.error("Enrichment failed: %s", stderr.decode())


async def _check_and_refresh() -> None:
    """
    Background task: fetch live Shopify catalog and compare with cached version.
    If the catalog changed → update products.json, re-enrich, invalidate memory cache.
    Runs once at startup without blocking request handling.
    """
    try:
        logger.info("Checking Shopify catalog for updates…")
        live = await _fetch_shopify()
        with open(PRODUCTS_FILE, encoding="utf-8") as f:
            cached = json.load(f)
        if _catalog_hash(live) == _catalog_hash(cached):
            logger.info("Catalog unchanged.")
            return
        logger.info("Catalog changed — updating products.json and re-enriching…")
        with open(PRODUCTS_FILE, "w", encoding="utf-8") as f:
            json.dump(live, f, ensure_ascii=False, indent=2)
        await _run_enrichment()
        invalidate_cache()
        logger.info("Catalog refresh complete.")
    except Exception as exc:
        logger.warning("Catalog refresh skipped (non-fatal): %s", exc)


# ---------------------------------------------------------------------------
# Startup
# ---------------------------------------------------------------------------

@app.on_event("startup")
async def startup() -> None:
    if not ENRICHED_FILE.exists():
        logger.warning(
            "products_enriched.json missing — run: python scripts/enrich_products.py"
        )
    else:
        logger.info("Enriched index ready (%d products).", len(load_enriched()))
    asyncio.create_task(_check_and_refresh())


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/")
async def root():
    return {"status": "ok", "service": "Coffeeriff AI Recommender"}


@app.get("/products")
async def products():
    return load_products()


@app.get("/quiz-config", response_model=QuizConfig)
async def quiz_config():
    return build_quiz_config(load_products())


@app.post("/recommend", response_model=list[Recommendation])
async def recommend(answers: QuizAnswers):
    try:
        results = await get_recommendations(answers)
        if not results:
            raise HTTPException(status_code=404, detail="Nessuna raccomandazione trovata. Riprova!")
        return results
    except Exception as e:
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=500, detail=str(e))
