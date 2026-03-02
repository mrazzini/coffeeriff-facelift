from pydantic import BaseModel


class QuizAnswers(BaseModel):
    flavor_profile: str  # Fruttato & Vivace / Floreale & Delicato / etc.
    brew_method: str     # Espresso / Filtro / Moka / French Press
    has_grinder: str     # Sì / No, compro già macinato / Non lo so
    process: str         # Pulito (lavato) / Dolce (naturale) / Fermentato / Non lo so ancora
    roast: str           # Chiara / Media / Sorprendimi


class Recommendation(BaseModel):
    product_name: str
    description: str
    description_bullets: list[str]
    match_reason: str
    price: str
    image_url: str
    shopify_url: str


class QuizQuestion(BaseModel):
    key: str
    question: str
    options: list[str]


class QuizConfig(BaseModel):
    questions: list[QuizQuestion]
