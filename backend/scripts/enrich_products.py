"""
One-time enrichment script.
Reads products.json, calls Groq in batches of 5, outputs products_enriched.json.

Usage:
    cd backend
    source venv/bin/activate
    python scripts/enrich_products.py
"""
import json
import os
import sys
import time
from pathlib import Path

from dotenv import load_dotenv
from groq import Groq

BASE_DIR = Path(__file__).parent.parent
load_dotenv(BASE_DIR / ".env")

DATA_DIR = BASE_DIR / "data"
INPUT_FILE = DATA_DIR / "products.json"
OUTPUT_FILE = DATA_DIR / "products_enriched.json"

BATCH_SIZE = 5

SYSTEM_PROMPT = """You are a coffee data extraction tool. Given a list of specialty coffee products,
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
- brew_compatibility: (array) subset of ["espresso","filtro","moka","french-press"]
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


def load_products() -> list[dict]:
    with open(INPUT_FILE, encoding="utf-8") as f:
        all_products = json.load(f)
    return [
        p for p in all_products
        if p.get("product_type", "").lower() in ("caffè", "caffe'", "")
        and "grinder" not in p.get("title", "").lower()
        and "macinacaff" not in p.get("title", "").lower()
    ]


def enrich_batch(client: Groq, batch: list[dict]) -> list[dict]:
    """Send one batch to Groq, return list of enriched dicts."""
    # Build minimal product representations to reduce token usage
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
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": json.dumps(payload, ensure_ascii=False)},
        ],
        temperature=0.1,  # Low temperature for consistent extraction
        max_tokens=2048,
    )

    raw = response.choices[0].message.content.strip()
    # Strip markdown fences if the model ignores instructions
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1]
        raw = raw.rsplit("```", 1)[0].strip()

    return json.loads(raw)


def main():
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        print("ERROR: GROQ_API_KEY not set in .env", file=sys.stderr)
        sys.exit(1)

    client = Groq(api_key=api_key)
    products = load_products()
    print(f"Loaded {len(products)} coffee products.")

    # Load existing enriched data to allow resuming interrupted runs
    enriched: dict[str, dict] = {}
    if OUTPUT_FILE.exists():
        with open(OUTPUT_FILE, encoding="utf-8") as f:
            enriched = json.load(f)
        print(f"Resuming — {len(enriched)} products already enriched.")

    # Filter to products not yet enriched
    pending = [p for p in products if p["handle"] not in enriched]
    print(f"{len(pending)} products to process.")

    batches = [pending[i:i + BATCH_SIZE] for i in range(0, len(pending), BATCH_SIZE)]

    for i, batch in enumerate(batches):
        handles = [p["handle"] for p in batch]
        print(f"  Batch {i + 1}/{len(batches)}: {handles}")
        try:
            results = enrich_batch(client, batch)
            for item in results:
                handle = item.get("handle")
                if handle:
                    enriched[handle] = {k: v for k, v in item.items() if k != "handle"}
            # Save after every batch so partial progress is preserved
            with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
                json.dump(enriched, f, ensure_ascii=False, indent=2)
            print(f"    ✓ saved ({len(enriched)} total enriched)")
        except Exception as e:
            print(f"    ✗ batch failed: {e}", file=sys.stderr)
            # Continue with next batch rather than aborting
        # Rate-limit courtesy pause
        if i < len(batches) - 1:
            time.sleep(1)

    print(f"\nDone. {len(enriched)} products written to {OUTPUT_FILE}")

    # Quick sanity check
    roast_values = {v.get("roast") for v in enriched.values()}
    print(f"Roast values found: {roast_values}")
    if "scura" in roast_values:
        print("WARNING: 'scura' roast detected — check extraction results")


if __name__ == "__main__":
    main()
