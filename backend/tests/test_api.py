import json
from unittest.mock import MagicMock, patch

import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app


@pytest.fixture
def mock_groq_client():
    """Return a Groq client mock that yields three valid product picks."""
    picks = [
        {
            "product_name": "El Salvador San Antonio \u2013 Geisha 168 hrs",
            "match_reason": "Con le tue preferenze fruttate questo lotto \u00e8 perfetto per te.",
        },
        {
            "product_name": "Etiopia Sidama Karamo \u2013 Gara Agena Natural G1 Premium",
            "match_reason": "I suoi sentori floreali ti sorprenderanno.",
        },
        {
            "product_name": "Colombia Tolima \u2013 100 A\u00f1os  Caturra Natural",
            "match_reason": "Dolcezza e acidit\u00e0 bilanciata, ideale per il filtro.",
        },
    ]
    client = MagicMock()
    client.chat.completions.create.return_value.choices[0].message.content = json.dumps(picks)
    return client


@pytest.mark.asyncio
async def test_health():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        r = await ac.get("/")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_products_returns_list():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        r = await ac.get("/products")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert "title" in data[0]
    assert "price" in data[0]


@pytest.mark.asyncio
async def test_recommend_mock(mock_groq_client):
    with patch("app.recommender._get_client", return_value=mock_groq_client):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            r = await ac.post(
                "/recommend",
                json={
                    "flavor_profile": "Fruttato & vivace \u2014 agrumi, frutti di bosco",
                    "brew_method": "Filtro \u2014 V60, Aeropress, Chemex",
                    "has_grinder": "S\u00ec",
                    "process": "Certo, sono aperto a nuove esperienze",
                },
            )
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    first = data[0]
    assert "product_name" in first
    assert "match_reason" in first
    assert "price" in first
    assert "shopify_url" in first
    assert first["shopify_url"].startswith("https://coffeeriff.com/products/")
