from .models import QuizConfig, QuizQuestion

# Origin grouping constants kept for reference / future restoration.
# El Salvador is intentionally grouped with Americas.
_AFRICA = {"Etiopia", "Kenya", "Rwanda", "Uganda", "Burundi"}
_AMERICAS = {"Colombia", "Nicaragua", "Brasile", "Guatemala", "Honduras", "Bolivia", "El Salvador"}

_ROAST_LABEL = {
    "chiara": "Chiara — leggera, fruttata, acida",
    "media": "Media — bilanciata, versatile",
}

# "altro" (blends with no single process) is excluded from quiz options intentionally.
# Both fermented variants collapse to the same display label so they don't appear twice.
_PROCESS_LABEL = {
    "lavato": "Pulito & bilanciato (lavato)",
    "naturale": "Dolce & fruttato (naturale)",
    "anaerobico": "Avventuroso & fermentato",
    "naturale-fermentato": "Avventuroso & fermentato",
    "decaf": "Decaffeinato",
}

# Preferred display order for process options
_PROCESS_ORDER = ["lavato", "naturale", "anaerobico", "naturale-fermentato", "decaf"]


def build_quiz_config(products: list[dict]) -> QuizConfig:
    """Build quiz questions derived entirely from enriched product catalog data."""
    enriched_entries = [p["enriched"] for p in products if p.get("enriched")]

    # Roast: only levels that genuinely appear in the catalog
    roast_values = sorted({e["roast"] for e in enriched_entries if e.get("roast")})
    roast_options = [_ROAST_LABEL[r] for r in roast_values if r in _ROAST_LABEL]
    roast_options.append("Sorprendimi")

    # Process: iterate in preferred order, skip "altro", deduplicate collapsed labels
    catalog_processes = {e["process"] for e in enriched_entries if e.get("process")}
    seen_labels: set[str] = set()
    process_options: list[str] = []
    for key in _PROCESS_ORDER:
        if key not in catalog_processes:
            continue
        label = _PROCESS_LABEL.get(key)
        if label and label not in seen_labels:
            process_options.append(label)
            seen_labels.add(label)
    process_options.append("Non lo so ancora — scegli tu")

    # Flavor profiles: fixed sensory archetypes (not catalog-derived)
    flavor_options = [
        "Fruttato & vivace — agrumi, frutti di bosco",
        "Floreale & delicato — camomilla, gelsomino",
        "Cioccolato & cremoso — cacao, nocciola, caramello",
        "Speziato & complesso — spezie dolci, miele, tabacco",
    ]

    return QuizConfig(questions=[
        QuizQuestion(
            key="flavor_profile",
            question="Quale profilo aromatico ti attira di più?",
            options=flavor_options,
        ),
        QuizQuestion(
            key="brew_method",
            question="Come prepari il caffè di solito?",
            options=["Espresso", "Filtro — V60, Chemex, dripper", "Moka", "French Press o Aeropress"],
        ),
        QuizQuestion(
            key="has_grinder",
            question="Hai un macinacaffè a casa?",
            options=["Sì", "No, compro già macinato", "Non lo so"],
        ),
        QuizQuestion(
            key="process",
            question="Vuoi provare qualcosa di diverso da quello che berresti di solito al bar?",
            options=process_options,
        ),
        QuizQuestion(
            key="roast",
            question="Come preferisci la tostatura?",
            options=roast_options,
        ),
    ])
