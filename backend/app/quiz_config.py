import re
from .models import QuizConfig, QuizQuestion


# Country → region groupings for the origin question
_AFRICA = ["Etiopia", "Kenya", "Rwanda", "Uganda", "Burundi"]
_CENTRAL_SOUTH_AMERICA = ["Colombia", "Nicaragua", "Brasile", "Guatemala", "Honduras", "Bolivia"]
_EL_SALVADOR = ["El Salvador"]


def build_quiz_config(products: list[dict]) -> QuizConfig:
    """Build quiz questions whose options reflect the actual product catalog."""

    # --- Determine which origin groups are actually represented ---
    has_africa = any(
        any(c in p["title"] for c in _AFRICA) for p in products
    )
    has_americas = any(
        any(c in p["title"] for c in _CENTRAL_SOUTH_AMERICA) for p in products
    )
    has_el_salvador = any("El Salvador" in p["title"] for p in products)

    origin_options: list[str] = []
    if has_africa:
        origin_options.append("Africa — floreale, fruttato (Etiopia, Kenya…)")
    if has_americas:
        origin_options.append("America — dolce, bilanciato (Colombia, Nicaragua…)")
    if has_el_salvador:
        origin_options.append("El Salvador — strutturato, complesso")
    origin_options.append("Sorprendimi — ovunque nel mondo")

    # --- Determine which processes are in the catalog ---
    processes: set[str] = set()
    for p in products:
        desc = p.get("description", "")
        m = re.search(r"Processo:\s*([^\n]+?)(?:\s+Origine:|\s+Altitudine:|$)", desc)
        if m:
            raw = m.group(1).strip().lower()
            if "lavato" in raw or "washed" in raw:
                processes.add("washed")
            elif "anaerobico" in raw or "ferment" in raw or "blu" in raw:
                processes.add("anaerobic")
            else:
                processes.add("natural")

    process_options: list[str] = []
    if "washed" in processes:
        process_options.append("Pulito & bilanciato (lavato)")
    if "natural" in processes:
        process_options.append("Dolce & fruttato (naturale)")
    if "anaerobic" in processes:
        process_options.append("Avventuroso & fermentato (anaerobico)")
    process_options.append("Non lo so ancora — scegli tu")

    questions = [
        QuizQuestion(
            key="roast",
            question="Come preferisci la tostatura?",
            options=[
                "Chiara — acida, fruttata, complessa",
                "Media — bilanciata, versatile",
                "Scura — intensa, corpo pieno",
                "Sorprendimi",
            ],
        ),
        QuizQuestion(
            key="flavor_profile",
            question="Quale profilo aromatico ti attira di più?",
            options=[
                "Fruttato & vivace — agrumi, frutti di bosco",
                "Floreale & delicato — camomilla, gelsomino",
                "Cioccolato & cremoso — cacao, nocciola, caramello",
                "Speziato & complesso — spezie dolci, miele, tabacco",
            ],
        ),
        QuizQuestion(
            key="brew_method",
            question="Come prepari il caffè di solito?",
            options=[
                "Espresso",
                "Filtro — V60, Chemex, dripper",
                "Moka",
                "French Press o Aeropress",
            ],
        ),
        QuizQuestion(
            key="origin",
            question="Da quale parte del mondo vorresti il tuo caffè?",
            options=origin_options,
        ),
        QuizQuestion(
            key="process",
            question="Quanto ami la complessità nel caffè?",
            options=process_options,
        ),
    ]

    return QuizConfig(questions=questions)
