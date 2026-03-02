from pydantic import BaseModel


class QuizAnswers(BaseModel):
    roast: str           # Chiara / Media / Scura / Sorprendimi
    flavor_profile: str  # Fruttato & Vivace / Floreale & Delicato / etc.
    brew_method: str     # Espresso / Filtro / Moka / French Press
    origin: str          # Africa / America / El Salvador / Sorprendimi
    process: str         # Pulito (lavato) / Dolce (naturale) / Fermentato / Non lo so ancora


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
