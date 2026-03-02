import json
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

_DATA_DIR = Path(__file__).parent.parent / "data"
_PRODUCTS_FILE = _DATA_DIR / "products.json"
_ENRICHED_FILE = _DATA_DIR / "products_enriched.json"

_catalog: list[dict] | None = None


def _is_coffee(p: dict) -> bool:
    return (
        p.get("product_type", "").lower() in ("caffè", "caffe'", "")
        and "grinder" not in p.get("title", "").lower()
        and "macinacaff" not in p.get("title", "").lower()
    )


def load_enriched() -> dict[str, dict]:
    """Return enriched product data keyed by handle. Empty dict if file missing."""
    if not _ENRICHED_FILE.exists():
        logger.warning(
            "products_enriched.json not found — "
            "run: python scripts/enrich_products.py"
        )
        return {}
    with open(_ENRICHED_FILE, encoding="utf-8") as f:
        return json.load(f)


def invalidate_cache() -> None:
    """Clear in-memory catalog so next call to load_products() re-reads disk."""
    global _catalog
    _catalog = None


def load_products() -> list[dict]:
    """Return filtered coffee products with enriched data merged in."""
    global _catalog
    if _catalog is None:
        with open(_PRODUCTS_FILE, encoding="utf-8") as f:
            all_products = json.load(f)
        enriched = load_enriched()
        _catalog = []
        for p in all_products:
            if _is_coffee(p):
                p["enriched"] = enriched.get(p["handle"], {})
                _catalog.append(p)
    return _catalog


def get_product_summary(products: list[dict]) -> str:
    """Legacy text summary — kept as fallback if enriched data is unavailable."""
    lines = []
    for p in products:
        lines.append(
            f"- {p['title']} | Prezzo: {p['price']} | "
            f"Tags: {p.get('tags', '')} | "
            f"Descrizione: {p.get('description', '')[:300]}"
        )
    return "\n".join(lines)
