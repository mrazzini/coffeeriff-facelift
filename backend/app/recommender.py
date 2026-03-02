import json
import os
from pathlib import Path

from groq import Groq
from dotenv import load_dotenv

from .models import QuizAnswers, Recommendation
from .products import load_products, get_product_summary

load_dotenv(Path(__file__).parent.parent / ".env")

_client = None


def _get_client() -> Groq:
    global _client
    if _client is None:
        _client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    return _client


def build_prompt(answers: QuizAnswers, product_catalog: str) -> str:
    return f"""Sei un esperto sommelier del caffè specialty. Un cliente ha completato un quiz sulle sue preferenze.

RISPOSTE DEL CLIENTE:
- Tostatura preferita: {answers.roast}
- Sapori preferiti: {answers.flavors}
- Metodo di preparazione: {answers.brew_method}
- Intensità desiderata: {answers.intensity}
- Livello di avventura: {answers.adventure}

CATALOGO PRODOTTI DISPONIBILI:
{product_catalog}

ISTRUZIONI:
1. Analizza le preferenze del cliente
2. Confrontale con i prodotti disponibili nel catalogo
3. Scegli i 3 prodotti che meglio corrispondono, basandoti su:
   - Profilo di tostatura
   - Note aromatiche e di sapore
   - Compatibilità con il metodo di preparazione
   - Complessità e qualità del caffè
4. Per ogni prodotto, spiega PERCHÉ è adatto al cliente in 1-2 frasi in italiano

Rispondi SOLO con un JSON array valido, senza markdown, senza commenti. Ogni elemento deve avere:
- "product_name": nome esatto dal catalogo
- "match_reason": spiegazione in italiano (1-2 frasi)

Esempio formato:
[{{"product_name": "Nome Prodotto", "match_reason": "Motivo in italiano"}}]"""


async def get_recommendations(answers: QuizAnswers) -> list[Recommendation]:
    products = load_products()
    catalog_text = get_product_summary(products)
    prompt = build_prompt(answers, catalog_text)

    chat = _get_client().chat.completions.create(
        messages=[{"role": "user", "content": prompt}],
        model="llama-3.3-70b-versatile",
        temperature=0.7,
        max_tokens=1024,
    )

    raw = chat.choices[0].message.content.strip()
    # Strip markdown fences if present
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1]
        raw = raw.rsplit("```", 1)[0]
    picks = json.loads(raw)

    # Map LLM picks back to full product data
    product_map = {p["title"].lower(): p for p in products}
    results = []
    for pick in picks[:3]:
        name = pick["product_name"]
        product = product_map.get(name.lower())
        if not product:
            # Fuzzy fallback: find closest match
            for key, p in product_map.items():
                if name.lower() in key or key in name.lower():
                    product = p
                    break
        if product:
            results.append(Recommendation(
                product_name=product["title"],
                description=product.get("description", "")[:200],
                match_reason=pick["match_reason"],
                price=product["price"],
                image_url=product.get("image_url", ""),
                shopify_url=f"https://coffeeriff.com/products/{product['handle']}",
            ))

    return results
