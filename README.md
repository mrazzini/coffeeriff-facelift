# Coffeeriff Facelift - AI-Enhanced Storefront
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
  │     • rewrites /api/* → AWS Lambda backend (server-side proxy)
  │
  └── FastAPI on AWS Lambda (backend)
        • GET  /              health check
        • GET  /products      Shopify catalog (filtered by category)
        • GET  /quiz-config   dynamic quiz questions
        • POST /recommend     LLM-powered product matching
              │
              ├── S3 bucket  (products.json + products_enriched.json)
              └── Groq API   (llama-3.3-70b-versatile)

  EventBridge (daily) → Refresh Lambda
        • fetches Shopify catalog
        • re-enriches via Groq if changed
        • writes updated JSON to S3
```

The frontend **never calls the Lambda backend directly from the browser**. All `/api/*` requests go to the Next.js server, which proxies them to API Gateway. This means CORS on API Gateway is only needed for direct browser access (not required for normal app usage).

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
│   ├── lambda_handler.py      Mangum wrapper (Lambda entry point)
│   ├── refresh_handler.py     scheduled catalog refresh Lambda
│   ├── template.yaml          SAM infrastructure template
│   ├── samconfig.toml         SAM deploy configuration
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

- Python 3.12+
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

The catalog is also refreshed daily by a scheduled Lambda (see Deployment below).

---

## Deployment

| Service | Platform | Trigger |
|---------|----------|---------|
| Backend (API) | AWS Lambda + API Gateway | push to `main` via CI, or `sam deploy` |
| Backend (refresh) | AWS Lambda + EventBridge | daily schedule (automatic) |
| Product data | AWS S3 | updated by refresh Lambda |
| Frontend | Vercel | push to `main` (auto-deploy) |

### Backend environment variables (AWS Lambda)

Set in the AWS Console (Lambda → Configuration → Environment variables) or via the SAM template:

| Variable | Value |
|----------|-------|
| `GROQ_API_KEY` | `gsk_...` from Groq console |
| `DATA_BUCKET` | S3 bucket name (e.g. `coffeeriff-data`) |
| `ALLOWED_ORIGINS` | Vercel production URL (optional, only for direct browser access) |

### Frontend environment variables (Vercel)

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | API Gateway URL, **no trailing slash** e.g. `https://abc123.execute-api.eu-south-1.amazonaws.com` |

> **Important:** after changing env vars in Vercel, click **Redeploy** on the latest deployment — Vercel only picks up env var changes on a new build.

### Deploying the backend

```bash
cd backend
sam build
sam deploy          # uses saved config in samconfig.toml
```

On first deploy, use `sam deploy --guided` to configure stack name, region, and parameters interactively.

---

## CI Pipeline

GitHub Actions runs on every push to `main` and `feat/**` branches:

1. **Backend lint** — `ruff check` (fast, no dependencies installed beyond ruff)
2. **Backend tests** — `pytest tests/` with Groq mocked (no real API key required)
3. **Frontend lint + type-check + build** — `npm run lint`, `npm run type-check`, `npm run build`
4. **Backend deploy** — `sam build` + `sam deploy` (only on push to `main`, requires `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` GitHub secrets)

---

## Maintenance

- **New products in the Shopify store** — the refresh Lambda runs daily via EventBridge, fetches the live catalog, and re-enriches automatically if the catalog changed. No manual action needed.
- **Groq API key expiry** — replace `GROQ_API_KEY` in the Lambda environment variables (AWS Console → Lambda → Configuration → Environment variables).
- **Quiz questions** — edit `backend/app/quiz_config.py`. No frontend changes needed (questions are fetched dynamically via `/quiz-config`).
- **Brand copy** — edit `frontend/app/page.tsx` (homepage) or `frontend/app/filosofia/page.tsx`.
