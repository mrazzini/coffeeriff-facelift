"""Fetch products from coffeeriff.com Shopify JSON endpoint."""
import json
import re
import httpx

SHOPIFY_URL = "https://coffeeriff.com/products.json"
OUTPUT_PATH = "backend/data/products.json"


def strip_html(html: str) -> str:
    """Remove HTML tags and decode entities."""
    text = re.sub(r"<[^>]+>", " ", html)
    text = re.sub(r"&[a-z]+;", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def fetch_all_products() -> list[dict]:
    """Fetch all products, paginating if needed."""
    all_products = []
    page = 1
    while True:
        print(f"Fetching page {page}...")
        resp = httpx.get(
            f"{SHOPIFY_URL}?page={page}&limit=250",
            timeout=30,
            verify=False,  # Corporate SSL proxy workaround
        )
        resp.raise_for_status()
        products = resp.json().get("products", [])
        if not products:
            break
        all_products.extend(products)
        page += 1
    return all_products


def parse_product(raw: dict) -> dict:
    """Extract relevant fields from a Shopify product."""
    body = strip_html(raw.get("body_html", ""))
    variant = raw.get("variants", [{}])[0]
    images = raw.get("images", [])

    return {
        "title": raw["title"],
        "handle": raw["handle"],
        "description": body[:500] if body else "",
        "price": variant.get("price", "0.00"),
        "tags": ", ".join(raw.get("tags", [])) if isinstance(raw.get("tags"), list) else raw.get("tags", ""),
        "image_url": images[0]["src"] if images else "",
        "product_type": raw.get("product_type", ""),
        "vendor": raw.get("vendor", ""),
    }


def main():
    raw_products = fetch_all_products()
    print(f"Found {len(raw_products)} products")

    parsed = [parse_product(p) for p in raw_products]

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(parsed, f, ensure_ascii=False, indent=2)

    print(f"Saved {len(parsed)} products to {OUTPUT_PATH}")
    for p in parsed:
        title = p['title'].encode('ascii', 'replace').decode()
        print(f"  - {title} ({p['price']})")


if __name__ == "__main__":
    main()
