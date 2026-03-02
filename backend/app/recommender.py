import json
import os
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
    """Build clean structured context for the recommendation LLM."""
    lines = []
    for p in products:
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
- Tostatura preferita: {answers.roast}
- Profilo di sapori: {answers.flavor_profile}
- Metodo di preparazione: {answers.brew_method}
- Origine preferita: {answers.origin}
- Tipo di processo: {answers.process}

CATALOGO PRODOTTI (JSON strutturato):
{catalog_context}

ISTRUZIONI:
1. Scegli i 3 prodotti che meglio corrispondono alle preferenze del cliente
2. Per ogni prodotto, rivolgiti direttamente all'utente usando "tu"
   Spiega perché è la scelta perfetta PER TE in 1-2 frasi in italiano

Rispondi SOLO con un JSON array valido, senza markdown. Ogni elemento deve avere:
- "product_name": nome esatto dal campo "title" nel catalogo
- "match_reason": spiegazione in italiano rivolta all'utente (usa "tu", 1-2 frasi)

Esempio: [{{"product_name": "Nome Prodotto", "match_reason": "Con le tue preferenze per..."}}]"""


async def get_recommendations(answers: QuizAnswers) -> list[Recommendation]:
    products = load_products()
    catalog_context = build_catalog_context(products)
    prompt = build_prompt(answers, catalog_context)

    chat = _get_client().chat.completions.create(
        messages=[{"role": "user", "content": prompt}],
        model="llama-3.3-70b-versatile",
        temperature=0.7,
        max_tokens=1024,
    )

    raw = chat.choices[0].message.content.strip()
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1]
        raw = raw.rsplit("```", 1)[0]
    picks = json.loads(raw)

    product_map = {p["title"].lower(): p for p in products}
    results = []
    for pick in picks[:3]:
        name = pick["product_name"]
        product = product_map.get(name.lower())
        if not product:
            for key, p in product_map.items():
                if name.lower() in key or key in name.lower():
                    product = p
                    break
        if product:
            e = product.get("enriched", {})
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

    return results
