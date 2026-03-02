import json
import os
import re
from pathlib import Path

from groq import Groq
from dotenv import load_dotenv

from .models import QuizAnswers, Recommendation
from .products import load_products, get_product_summary

load_dotenv(Path(__file__).parent.parent / ".env")

_client = None

# Labels that appear in product descriptions (in typical order)
_DESCRIPTION_LABELS = ["Processo", "Origine", "Altitudine", "Varietà", "Grade", "Crop", "Punteggio"]


def _get_client() -> Groq:
    global _client
    if _client is None:
        _client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    return _client


def parse_description_bullets(description: str) -> list[str]:
    """Split a product description string into concise bullet-point fragments."""
    bullets = []
    first_label = re.search(r"\b(?:" + "|".join(_DESCRIPTION_LABELS) + r"):", description)
    if first_label:
        flavor_notes = description[:first_label.start()].strip().rstrip("—").strip()
        if flavor_notes:
            bullets.append(flavor_notes)
        remainder = description[first_label.start():]
    else:
        return [description.strip()[:200]]

    # Split on each known label boundary
    pattern = r"(?=" + "|".join(f"{lbl}:" for lbl in _DESCRIPTION_LABELS) + r")"
    for part in re.split(pattern, remainder):
        part = part.strip()
        if part:
            # Truncate at em-dash separator that precedes the product story narrative
            part = re.split(r"\s+—\s+", part)[0]
            part = part.split("\n")[0].strip().rstrip("—").strip()
            bullets.append(part)

    return bullets


def build_prompt(answers: QuizAnswers, product_catalog: str) -> str:
    return f"""Sei un esperto sommelier del caffè specialty. Un cliente ha completato un quiz sulle sue preferenze.

RISPOSTE DEL CLIENTE:
- Tostatura preferita: {answers.roast}
- Profilo di sapori preferito: {answers.flavor_profile}
- Metodo di preparazione: {answers.brew_method}
- Origine preferita: {answers.origin}
- Tipo di processo preferito: {answers.process}

CATALOGO PRODOTTI DISPONIBILI:
{product_catalog}

ISTRUZIONI:
1. Analizza le preferenze del cliente
2. Confrontale con i prodotti disponibili nel catalogo
3. Scegli i 3 prodotti che meglio corrispondono, basandoti su:
   - Profilo di tostatura
   - Note aromatiche e di sapore
   - Compatibilità con il metodo di preparazione
   - Origine geografica e processo di lavorazione
4. Per ogni prodotto, rivolgiti direttamente all'utente usando "tu".
   Spiega perché è la scelta perfetta PER TE in 1-2 frasi in italiano.
   Esempio: "Con le tue preferenze per i sapori fruttati, questo caffè ti sorprenderà con le sue note di..."

Rispondi SOLO con un JSON array valido, senza markdown, senza commenti. Ogni elemento deve avere:
- "product_name": nome esatto dal catalogo
- "match_reason": spiegazione in italiano rivolta direttamente all'utente (1-2 frasi, usa "tu")

Esempio formato:
[{{"product_name": "Nome Prodotto", "match_reason": "Con il tuo amore per..."}}]"""


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
            for key, p in product_map.items():
                if name.lower() in key or key in name.lower():
                    product = p
                    break
        if product:
            full_desc = product.get("description", "")
            results.append(Recommendation(
                product_name=product["title"],
                description=full_desc[:200],
                description_bullets=parse_description_bullets(full_desc),
                match_reason=pick["match_reason"],
                price=product["price"],
                image_url=product.get("image_url", ""),
                shopify_url=f"https://coffeeriff.com/products/{product['handle']}",
            ))

    return results
