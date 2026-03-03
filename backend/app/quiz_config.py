from .models import QuizConfig, QuizQuestion


def build_quiz_config(products: list[dict]) -> QuizConfig:
    """Build quiz questions. Four questions, no roast."""
    return QuizConfig(questions=[
        QuizQuestion(
            key="process",
            question="Vuoi provare qualcosa di diverso da quello che berresti di solito al bar?",
            options=[
                "Certo, sono aperto a nuove esperienze",
                "No, voglio qualcosa di familiare",
                "Non lo so ancora, sorprendimi!",
            ],
        ),
        QuizQuestion(
            key="flavor_profile",
            question="Quale profilo aromatico ti attira di più?",
            options=[
                "Fruttato & vivace — agrumi, frutti di bosco",
                "Floreale & delicato — camomilla, gelsomino",
                "Cioccolato & cremoso — cacao, nocciola, caramello",
                "Non lo so, sorprendimi",
            ],
        ),
        QuizQuestion(
            key="brew_method",
            question="Come prepari il caffè di solito?",
            options=["Espresso", "Filtro — V60, Aeropress, Chemex", "Moka", "Capsule Nespresso"],
        ),
        QuizQuestion(
            key="has_grinder",
            question="Hai un macinacaffè a casa?",
            options=["Sì", "No, compro già macinato", "Uso capsule Nespresso", "Non lo so"],
        ),
    ])
