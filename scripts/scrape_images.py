"""
Scrape non-product lifestyle/brand images from coffeeriff.com.

The site is protected by Cloudflare, which blocks plain HTTP clients (httpx,
requests, curl). This script uses Playwright with a stealth patch so the
browser fingerprint looks like a real user.

SETUP (run once):
    pip install playwright playwright-stealth pillow
    playwright install chromium

RUN:
    python scripts/scrape_images.py

OUTPUT:
    frontend/public/images/          — downloaded image files
    frontend/public/images/manifest.json — maps page → list of local paths
"""

import asyncio
import hashlib
import json
import mimetypes
import re
from pathlib import Path
from urllib.parse import urljoin, urlparse

import httpx

try:
    from playwright.async_api import async_playwright
except ImportError:
    raise SystemExit(
        "Playwright not installed. Run:\n"
        "  pip install playwright playwright-stealth\n"
        "  playwright install chromium"
    )

try:
    from playwright_stealth import Stealth
    _stealth = Stealth()
    stealth_async = _stealth.apply_stealth_async
except ImportError:
    stealth_async = None  # stealth is optional but recommended

# ── Configuration ────────────────────────────────────────────────────────────

BASE_URL = "https://coffeeriff.com"

# Pages to visit for brand/lifestyle images (not the products API)
TARGET_PAGES = [
    "/",
    "/pages/filosofia",
    "/collections/all",
]

OUTPUT_DIR = Path(__file__).parent.parent / "frontend" / "public" / "images"

# Minimum file size to keep (skip tiny icons/spacers)
MIN_SIZE_BYTES = 8_000  # ~8 KB

# Only keep images from these CDN hosts (avoids downloading tracker pixels etc.)
ALLOWED_HOSTS = {
    "cdn.shopify.com",
    "coffeeriff.com",
    "www.coffeeriff.com",
}

# Skip product images already present in products.json (keyed by handle substring)
SKIP_PATTERNS = [
    r"/products/",       # product detail images
    r"icon",             # icons
    r"favicon",
    r"badge",
    r"logo",             # logo files (already in /public)
    r"payment",          # payment method logos
    r"\.svg$",           # SVGs (usually icons)
]

# ── Helpers ───────────────────────────────────────────────────────────────────

def _url_to_filename(url: str) -> str:
    """Derive a stable local filename from a CDN URL."""
    parsed = urlparse(url)
    # Use the last path segment, stripping Shopify query params
    stem = parsed.path.split("/")[-1].split("?")[0]
    if not stem:
        stem = hashlib.md5(url.encode()).hexdigest()[:12]
    return stem


def _should_skip(url: str) -> bool:
    for pattern in SKIP_PATTERNS:
        if re.search(pattern, url, re.IGNORECASE):
            return True
    host = urlparse(url).netloc
    return host not in ALLOWED_HOSTS


async def _collect_image_urls(page) -> list[str]:
    """Extract all image URLs visible on the current page."""
    urls = set()

    # <img src> and <img srcset>
    imgs = await page.query_selector_all("img")
    for img in imgs:
        src = await img.get_attribute("src") or ""
        srcset = await img.get_attribute("srcset") or ""
        if src:
            urls.add(urljoin(BASE_URL, src))
        for part in srcset.split(","):
            candidate = part.strip().split(" ")[0]
            if candidate:
                urls.add(urljoin(BASE_URL, candidate))

    # CSS background-image
    bg_sources = await page.evaluate("""() => {
        const urls = [];
        document.querySelectorAll('*').forEach(el => {
            const style = window.getComputedStyle(el);
            const bg = style.backgroundImage;
            if (bg && bg !== 'none') {
                const match = bg.match(/url\\(["']?([^"')]+)["']?\\)/);
                if (match) urls.push(match[1]);
            }
        });
        return urls;
    }""")
    for u in bg_sources:
        urls.add(urljoin(BASE_URL, u))

    return [u for u in urls if u.startswith("http") and not _should_skip(u)]


async def _download(url: str, dest: Path, client: httpx.AsyncClient) -> bool:
    """Download a single image. Returns True if saved."""
    try:
        r = await client.get(url, follow_redirects=True, timeout=20)
        if r.status_code != 200:
            return False
        if len(r.content) < MIN_SIZE_BYTES:
            return False
        # Infer extension from content-type if missing
        if "." not in dest.suffix:
            ct = r.headers.get("content-type", "")
            ext = mimetypes.guess_extension(ct.split(";")[0].strip()) or ".jpg"
            dest = dest.with_suffix(ext)
        dest.write_bytes(r.content)
        return True
    except Exception as e:
        print(f"    ✗ download failed: {url} — {e}")
        return False


# ── Main ──────────────────────────────────────────────────────────────────────

async def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    manifest: dict[str, list[str]] = {}

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--no-sandbox",
                "--disable-blink-features=AutomationControlled",
            ],
        )
        context = await browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            ),
            viewport={"width": 1440, "height": 900},
            locale="it-IT",
        )
        page = await context.new_page()

        # Apply stealth patch if available (removes navigator.webdriver fingerprint)
        if stealth_async:
            await stealth_async(page)
        else:
            print("⚠  playwright-stealth not installed — Cloudflare may still block.")
            print("   Run: pip install playwright-stealth\n")

        async with httpx.AsyncClient(
            headers={"Referer": BASE_URL, "Accept": "image/*,*/*"},
            verify=False,
        ) as client:
            for path in TARGET_PAGES:
                url = BASE_URL + path
                print(f"\n→ Visiting {url}")
                try:
                    resp = await page.goto(url, wait_until="networkidle", timeout=30_000)
                    if resp and resp.status == 403:
                        print(f"  ✗ 403 Forbidden — Cloudflare blocked this page.")
                        print(
                            "  Fallback: open this URL in Chrome, use DevTools → Network → "
                            "Img, copy URLs, then run scripts/download_images.py with that list."
                        )
                        continue
                    if resp and resp.status == 404:
                        print(f"  ✗ 404 — page does not exist, skipping.")
                        continue
                except Exception as e:
                    print(f"  ✗ navigation error: {e}")
                    continue

                # Scroll to trigger lazy-load
                await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                await page.wait_for_timeout(1500)

                image_urls = await _collect_image_urls(page)
                print(f"  Found {len(image_urls)} candidate images")

                saved: list[str] = []
                for img_url in image_urls:
                    filename = _url_to_filename(img_url)
                    dest = OUTPUT_DIR / filename
                    if dest.exists():
                        print(f"  ↩ already exists: {filename}")
                        saved.append(f"/images/{filename}")
                        continue
                    ok = await _download(img_url, dest, client)
                    if ok:
                        print(f"  ✓ {filename}")
                        saved.append(f"/images/{filename}")

                manifest[path] = saved

        await browser.close()

    manifest_path = OUTPUT_DIR / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False))
    total = sum(len(v) for v in manifest.values())
    print(f"\n✅ Done — {total} images saved to {OUTPUT_DIR}")
    print(f"   Manifest: {manifest_path}")
    print(
        "\nNext step: commit frontend/public/images/ and reference the images "
        "in frontend/app/page.tsx hero section or brand identity section."
    )


if __name__ == "__main__":
    asyncio.run(main())
