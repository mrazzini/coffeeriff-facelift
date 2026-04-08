import logging
import os

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from .models import QuizAnswers, QuizConfig, Recommendation
from .recommender import get_recommendations
from .products import load_products
from .quiz_config import build_quiz_config

load_dotenv()

logger = logging.getLogger("coffeeriff")
logging.basicConfig(level=logging.INFO)

app = FastAPI(title="Coffeeriff AI Recommender", version="1.0.0")

allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/")
async def root():
    return {"status": "ok", "service": "Coffeeriff AI Recommender"}


@app.get("/products")
async def products(category: str | None = Query(None)):
    return load_products(category)


@app.get("/quiz-config", response_model=QuizConfig)
async def quiz_config():
    return build_quiz_config(load_products("coffee"))


@app.post("/recommend", response_model=list[Recommendation])
async def recommend(answers: QuizAnswers):
    try:
        results = await get_recommendations(answers)
        if not results:
            raise HTTPException(
                status_code=404,
                detail="Nessuna raccomandazione trovata. Riprova!",
            )
        return results
    except Exception as e:
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=500, detail=str(e))
