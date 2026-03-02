import json
from pathlib import Path

_catalog = None


def load_products() -> list[dict]:
    global _catalog
    if _catalog is None:
        data_path = Path(__file__).parent.parent / "data" / "products.json"
        with open(data_path, "r", encoding="utf-8") as f:
            all_products = json.load(f)
        # Filter to coffee products only (exclude accessories/grinders)
        _catalog = [
            p for p in all_products
            if p.get("product_type", "").lower() in ("caffè", "caffe'", "")
            and "grinder" not in p.get("title", "").lower()
            and "macinacaff" not in p.get("title", "").lower()
        ]
    return _catalog


def get_product_summary(products: list[dict]) -> str:
    """Build a text summary of all products for the LLM prompt."""
    lines = []
    for p in products:
        lines.append(
            f"- {p['title']} | Prezzo: {p['price']} | "
            f"Tags: {p.get('tags', '')} | "
            f"Descrizione: {p.get('description', '')[:300]}"
        )
    return "\n".join(lines)
