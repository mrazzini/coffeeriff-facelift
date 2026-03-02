from pydantic import BaseModel


class QuizAnswers(BaseModel):
    roast: str          # Leggero / Medio / Scuro / Sorprendimi
    flavors: str        # Fruttato & Vivace / Cioccolato & Nocciola / etc.
    brew_method: str    # Filtro / Espresso / Moka / French Press / Non lo so ancora
    intensity: str      # Delicato / Bilanciato / Forte / Fortissimo
    adventure: str      # Classico & affidabile / Aperto a suggerimenti / Sorprendimi!


class Recommendation(BaseModel):
    product_name: str
    description: str
    match_reason: str
    price: str
    image_url: str
    shopify_url: str
