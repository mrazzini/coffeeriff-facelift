You are a senior full-stack product engineer and AI architect.

Your task is to help me build a working MVP of an AI-enhanced e‑commerce experience for a  specialty coffee roaster (coffeeriff - website: www.coffeeriff.com)

This is a rapid prototype focused on:

*   End‑to‑end delivery
*   Clean UX
*   One strong AI feature
*   Maintainability
*   Real‑world deployment

## PROJECT CONTEXT

***

Target brand: Coffeeriff (specialty coffee roaster)  
Platform: Shopify (existing store)  
Goal: Build an “intelligence layer” on top of Shopify

I want to show a live demo to the owner.

## CORE MVP OBJECTIVE

***

Create a working prototype that includes:

1.  A redesigned storefront experience (theme or headless)
2.  One integrated AI feature powered by Groq API
3.  Simple backend (FastAPI)
4.  Embeddable frontend widget/component
5.  Clear setup + maintenance path

## PRIMARY AI FEATURE (CHOOSE ONE)

***

Implement ONE of the following (prioritize simplicity):

**Option A — Coffee Recommender**

*   Short quiz (3–5 questions)
*   AI maps answers → products

**Option B — AI Product Summary**

*   LLM generates “Amazon‑style” insights
*   Based on product + reviews

**Option C — Brew Assistant**

*   User inputs brew method
*   AI suggests recipe

Choose the easiest first.

## TECH STACK

***

Backend:

*   Python
*   FastAPI
*   PostgreSQL (optional for MVP)
*   Groq API (LLM calls)

Frontend:

*   Shopify theme customization OR
*   Headless frontend (Next.js / simple React)
*   Embedded JS widget

Integration:

*   Shopify Storefront API
*   Webhooks (optional for MVP)

***

## WORKFLOW

***

Proceed in phases:

### Phase 1 – System Design

*   Propose architecture
*   Choose AI feature
*   Define data flow

### Phase 2 – Shopify Integration

*   Explain how to connect to products
*   Setup dev store
*   API access

### Phase 3 – Backend

*   FastAPI app
*   Groq client
*   One main endpoint

### Phase 4 – Frontend

*   Widget / section
*   UX flow
*   API calls

### Phase 5 – Deployment

*   Local + cloud
*   Environment variables
*   Security basics

### Phase 6 – Handoff

*   Docs
*   Admin instructions

***

## ARCHITECTURE

***

Shopify (products, checkout)  
  ↓  
FastAPI (AI + logic)  
  ↓  
Frontend Widget / Section

## DESIGN PRINCIPLES

***

*   Mobile‑first
*   Minimal UI
*   Fast loading
*   Non‑intrusive
*   Easy for non‑technical owner

NO overengineering.

## DELIVERABLES

***

By the end, I need:

1.  Running demo (local + deployable)
2.  One AI‑powered feature working
3.  Installation guide
4.  Maintenance notes
5.  Demo script

## DEVELOPMENT MODE

***

*   Use the appropriate skill to generate frontend code (prompt user to activate if you feel the need to)
*   Keep backend clean and readable
*   Favor mock data over complex pipelines
*   Build incrementally
*   Test each layer

***

## CONSTRAINTS

***

*   Budget: minimal
*   Timeline: 1 week
*   Must be understandable by non‑dev owner or require minimal hand-off and continuous support
*   Must not break existing store

## OUTPUT FORMAT

***

Always respond with:

1.  Explanation
2.  Architecture diagram (text)
3.  Step‑by‑step implementation
4.  Code examples
5.  Next actions

***

## BUILD & RUN

### Backend (FastAPI)
```bash
cd backend
python -m venv venv && source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
cp .env.example .env  # then add your GROQ_API_KEY
uvicorn app.main:app --reload --port 8000
```

### Frontend (Next.js) — requires Node >= 18
```bash
cd frontend
npm install
cp .env.example .env.local  # set NEXT_PUBLIC_API_URL
npm run dev
```

### Fetch Products
```bash
python scripts/fetch_products.py
```

## CURRENT STATUS — HANDOFF NOTES

**Date**: 2026-03-02
**Feature implemented**: Option A — Coffee Recommender Quiz (Italian)

### What is DONE and VERIFIED WORKING:
- **Backend (FastAPI)**: Fully functional, tested locally
  - `GET /` — health check ✓
  - `GET /products` — returns 32 coffee products (grinder filtered out) ✓
  - `POST /recommend` — takes quiz answers, calls Groq llama-3.3-70b-versatile, returns 3 product recommendations with Italian reasoning, real prices, real Shopify URLs ✓
  - CORS configured via `ALLOWED_ORIGINS` env var
  - Groq client is lazy-initialized (server starts even without API key)
  - `.env` file with `GROQ_API_KEY=gsk_...` exists in `backend/.env` (not committed)
- **Product data**: 33 products fetched from coffeeriff.com/products.json, saved to `backend/data/products.json`
  - Rich Italian descriptions with flavor notes, origin, SCA scores
  - Product types: 20 "Caffè" + 4 "CAFFE'" + 9 misc (grinder filtered out)
- **Frontend (Next.js 14)**: All code written, NOT yet built/tested
  - `app/page.tsx` — Hero landing page "Trova il Tuo Caffè Perfetto"
  - `app/quiz/page.tsx` — 5-step Italian quiz with state machine, loading spinner, error handling, results display
  - `components/QuizStep.tsx` — Card-based option selector with hover animations
  - `components/ResultsCard.tsx` — Product card with image, reasoning, "Vai al Prodotto →" link
  - `components/ProgressBar.tsx` — Quiz progress indicator
  - `lib/api.ts` — Backend client (uses `NEXT_PUBLIC_API_URL`)
  - Dark coffee palette (Tailwind: coffee-50 through coffee-900)
  - `package.json` and all configs present, `node_modules` installed (but for Node 14)
- **Deployment configs**: `backend/Procfile`, `backend/railway.toml`, `frontend/vercel.json`

### What REMAINS TO DO:
1. **Build and test the frontend** — needs Node >= 18 (use GitHub Codespace or machine with modern Node)
   - Run `cd frontend && npm install && npm run dev`
   - Verify quiz flow works end-to-end against the backend
   - Check mobile responsiveness
2. **Deploy backend** to Railway/Render
   - Set env vars: `GROQ_API_KEY`, `ALLOWED_ORIGINS` (include Vercel URL)
   - The backend runs with: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. **Deploy frontend** to Vercel
   - Set env var: `NEXT_PUBLIC_API_URL` (point to deployed backend URL)
4. **Update `ALLOWED_ORIGINS`** in backend to include the Vercel production URL
5. **End-to-end test** on production URLs
6. **Optional polish**: favicon, Open Graph meta tags, loading skeleton improvements

### Known Issues / Notes:
- Corporate network (PPG) blocks some HTTPS downloads (SSL inspection proxy) — use `verify=False` for Python httpx or work in Codespace
- The `.env` key format must be `GROQ_API_KEY=gsk_...` (not `groq_api-key`)
- Model `llama3-70b-8192` is decommissioned — code already uses `llama-3.3-70b-versatile`
- `node_modules/` in frontend was installed with Node 14 — delete and reinstall with Node 18+ before building

## DEPLOYMENT

- Frontend → Vercel (set `NEXT_PUBLIC_API_URL` env var)
- Backend → Railway/Render (set `GROQ_API_KEY` and `ALLOWED_ORIGINS` env vars)
