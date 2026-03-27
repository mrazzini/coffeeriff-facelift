# Coffeeriff Facelift — AI-Enhanced Storefront
[**Live demo link**](https://coffeeriff-facelift.vercel.app/)

A headless frontend + AI backend layer built on top of the existing [Coffeeriff](https://coffeeriff.com) Shopify store. The project adds a coffee recommender quiz powered by an LLM without touching the live Shopify theme.

---

## What It Does

![Demo](public/website-demo.gif)

- **Recommender quiz** — 4 questions about taste preferences, brew method, grinder availability, and openness to experimentation. An LLM matches the answers to real products from the live catalog and returns 3 personalised picks with Italian-language explanations.
- **Product catalogue pages** — browseable category pages for Caffè, Capsule, and Accessori, each pulling live data from the backend.
- **Brand pages** — homepage and Filosofia page with real brand copy.

---

## Architecture

```
Browser
  │
  ├── Next.js on Vercel (frontend)
  │     • serves all pages
  │     • rewrites /api/* → Railway backend (server-side proxy)
  │
  └── FastAPI on Railway (backend)
        • GET  /              health check
        • GET  /products      Shopify catalog (filtered by category)
        • GET  /quiz-config   dynamic quiz questions
        • POST /recommend     LLM-powered product matching
              │
              ├── products.json  (local snapshot, refreshed on startup)
              └── Groq API  (llama-3.3-70b-versatile)
```

The frontend **never calls Railway directly from the browser**. All `/api/*` requests go to the Next.js server, which proxies them to Railway. This means CORS on Railway is only needed for direct browser access (not required for normal app usage).

---

## Project Structure

```
coffeeriff-facelift/
├── backend/
│   ├── app/
│   │   ├── main.py          FastAPI app, startup, routes
│   │   ├── models.py        Pydantic schemas
│   │   ├── products.py      catalog loading, category classification
│   │   ├── recommender.py   Groq prompt + response parsing
│   │   └── quiz_config.py   dynamic quiz question builder
│   ├── data/
│   │   ├── products.json           raw Shopify snapshot
│   │   └── products_enriched.json  LLM-enriched metadata
│   ├── scripts/
│   │   ├── fetch_products.py       fetch from coffeeriff.com/products.json
│   │   └── enrich_products.py      run once to build enriched index
│   ├── tests/
│   │   └── test_api.py
│   ├── requirements.txt
│   ├── railway.toml
│   └── .env.example
├── frontend/
│   ├── app/
│   │   ├── page.tsx            homepage
│   │   ├── quiz/page.tsx       recommender quiz
│   │   ├── caffetteria/        coffee products (list + detail)
│   │   ├── capsule/            capsule products (list + detail)
│   │   ├── accessori/          accessories (list + detail)
│   │   └── filosofia/page.tsx  brand story
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── ProductCard.tsx
│   │   ├── DiscoveryBoxCard.tsx
│   │   └── FilterBar.tsx
│   ├── lib/api.ts              typed API client
│   ├── next.config.js          proxy rewrite rule
│   ├── vercel.json
│   └── .env.example
├── .github/workflows/ci.yml
└── scripts/                    standalone data scripts (root level alias)
```

---

## Local Development

### Prerequisites

- Python 3.11+
- Node.js 18+
- A Groq API key — [console.groq.com](https://console.groq.com)

### Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# edit .env and set GROQ_API_KEY=gsk_...
uvicorn app.main:app --reload --port 8000
```

Verify: `curl http://localhost:8000/` → `{"status":"ok",...}`

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
# .env.local: NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Refresh product data

```bash
cd backend
python scripts/fetch_products.py        # re-fetch from Shopify
python scripts/enrich_products.py       # rebuild enriched index (calls Groq)
```

The backend also checks for catalog changes automatically on startup.

---

## Deployment

| Service | Platform | Trigger |
|---------|----------|---------|
| Backend | Railway | push to `main` (auto-deploy) |
| Frontend | Vercel | push to `main` (auto-deploy) |

### Backend environment variables (Railway)

| Variable | Value |
|----------|-------|
| `GROQ_API_KEY` | `gsk_...` from Groq console |
| `ALLOWED_ORIGINS` | Vercel production URL (optional, only for direct browser access) |

### Frontend environment variables (Vercel)

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | Railway URL, **no trailing slash** e.g. `https://coffeeriff-facelift-production.up.railway.app` |

> **Important:** after changing env vars in Vercel, click **Redeploy** on the latest deployment — Vercel only picks up env var changes on a new build.

---

## CI Pipeline

GitHub Actions runs on every push to `main` and `feat/**` branches:

1. **Backend lint** — `ruff check` (fast, no dependencies installed beyond ruff)
2. **Backend tests** — `pytest tests/` with Groq mocked (no real API key required)
3. **Frontend lint + type-check + build** — `npm run lint`, `npm run type-check`, `npm run build`

---

## Maintenance

- **New products in the Shopify store** — the backend fetches the live catalog on startup and re-enriches automatically if the catalog changed. No manual action needed.
- **Groq API key expiry** — replace `GROQ_API_KEY` in Railway and redeploy.
- **Quiz questions** — edit `backend/app/quiz_config.py`. No frontend changes needed (questions are fetched dynamically via `/quiz-config`).
- **Brand copy** — edit `frontend/app/page.tsx` (homepage) or `frontend/app/filosofia/page.tsx`.
