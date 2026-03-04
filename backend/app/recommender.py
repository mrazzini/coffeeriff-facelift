import json
import os
import random
from pathlib import Path

from groq import Groq
from dotenv import load_dotenv

from .models import QuizAnswers, Recommendation
from .products import load_products

load_dotenv(Path(__file__).parent.parent / ".env")

_client = None


def _get_client() -> Groq:
    global _client
    if _client is None:
        _client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    return _client


def build_catalog_context(products: list[dict]) -> str:
    """Build clean structured context for the recommendation LLM.
    Shuffles product order to prevent primacy/recency bias."""
    shuffled = list(products)
    random.shuffle(shuffled)
    lines = []
    for p in shuffled:
        e = p.get("enriched", {})
        entry = {
            "title": p["title"],
            "handle": p["handle"],
            "price": p["price"],
            "roast": e.get("roast"),
            "process": e.get("process"),
            "origin": f"{e.get('origin_country')} – {e.get('origin_region')}",
            "flavor_notes": e.get("flavor_notes", []),
            "brew": e.get("brew_compatibility", []),
            "sca": e.get("sca_score"),
        }
        lines.append(json.dumps(entry, ensure_ascii=False))
    return "\n".join(lines)


def build_prompt(answers: QuizAnswers, catalog_context: str) -> str:
    return f"""Sei un esperto sommelier del caffè specialty. Un cliente ha completato un quiz sulle sue preferenze.

RISPOSTE DEL CLIENTE:
- Profilo di sapori: {answers.flavor_profile}
- Metodo di preparazione: {answers.brew_method}
- Ha un macinacaffè: {answers.has_grinder}
- Preferenza complessità: {answers.process}

CATALOGO PRODOTTI (JSON strutturato, ordine casuale):
{catalog_context}

ISTRUZIONI:
1. Considera OGNI singolo prodotto del catalogo prima di scegliere
2. Scegli 5 prodotti candidati con caratteristiche DIVERSE tra loro (diversi processi, diverse origini, diverse tostature)
3. Per ogni prodotto, rivolgiti direttamente all'utente usando "tu"
   Spiega perché è la scelta perfetta PER TE in 1-2 frasi in italiano

Rispondi SOLO con un JSON array valido, senza markdown. Ogni elemento deve avere:
- "product_name": nome esatto dal campo "title" nel catalogo
- "match_reason": spiegazione in italiano rivolta all'utente (usa "tu", 1-2 frasi)

Esempio: [{{"product_name": "Nome Prodotto", "match_reason": "Con le tue preferenze per..."}}]"""


def _fallback_products(products: list[dict], answers: QuizAnswers, exclude_handles: set) -> list[dict]:
    """Fill remaining slots from catalog filtered by brew_compatibility."""
    brew_key = None
    bm = answers.brew_method.lower()
    if "nespresso" in bm or "capsule" in bm:
        return []
    if "espresso" in bm:
        brew_key = "espresso"
    elif "filtro" in bm or "v60" in bm or "chemex" in bm or "aeropress" in bm:
        brew_key = "filtro"
    elif "moka" in bm:
        brew_key = "moka"

    candidates = [
        p for p in products
        if p["handle"] not in exclude_handles
        and (brew_key is None or brew_key in (p.get("enriched", {}).get("brew_compatibility") or []))
    ]
    random.shuffle(candidates)
    return candidates


async def get_recommendations(answers: QuizAnswers) -> list[Recommendation]:
    products = load_products("coffee")
    catalog_context = build_catalog_context(products)
    prompt = build_prompt(answers, catalog_context)

    chat = _get_client().chat.completions.create(
        messages=[{"role": "user", "content": prompt}],
        model="llama-3.3-70b-versatile",
        temperature=0.7,
        max_tokens=1200,
    )

    raw = chat.choices[0].message.content.strip()
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1]
        raw = raw.rsplit("```", 1)[0]
    picks = json.loads(raw)

    product_map = {p["title"].lower(): p for p in products}

    def resolve_product(name: str) -> dict | None:
        exact = product_map.get(name.lower())
        if exact:
            return exact
        for key, p in product_map.items():
            if name.lower() in key or key in name.lower():
                return p
        return None

    # Build up to 5 candidates from LLM picks, dedup by process for variety
    results: list[Recommendation] = []
    seen_handles: set = set()
    seen_processes: set = set()

    for pick in picks[:5]:
        if len(results) >= 3:
            break
        product = resolve_product(pick["product_name"])
        if not product or product["handle"] in seen_handles:
            continue
        e = product.get("enriched", {})
        proc = e.get("process", "unknown")
        # Allow at most one product per non-standard process to ensure variety
        if proc in seen_processes and proc not in ("lavato", "altro"):
            continue
        seen_processes.add(proc)
        seen_handles.add(product["handle"])
        bullets = e.get("bullets") or [product.get("description", "")[:200]]
        results.append(Recommendation(
            product_name=product["title"],
            description=product.get("description", "")[:200],
            description_bullets=bullets,
            match_reason=pick["match_reason"],
            price=product["price"],
            image_url=product.get("image_url", ""),
            shopify_url=f"https://coffeeriff.com/products/{product['handle']}",
        ))

    # Fallback: fill remaining slots if LLM didn't return enough valid matches
    if len(results) < 3:
        for p in _fallback_products(products, answers, seen_handles):
            if len(results) >= 3:
                break
            e = p.get("enriched", {})
            bullets = e.get("bullets") or [p.get("description", "")[:200]]
            results.append(Recommendation(
                product_name=p["title"],
                description=p.get("description", "")[:200],
                description_bullets=bullets,
                match_reason="Un'ottima scelta dal nostro catalogo che potrebbe fare al caso tuo.",
                price=p["price"],
                image_url=p.get("image_url", ""),
                shopify_url=f"https://coffeeriff.com/products/{p['handle']}",
            ))

    return results
