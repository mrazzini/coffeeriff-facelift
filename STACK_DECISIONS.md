# Stack Decisions — Why We Built It This Way

This document explains the architectural and tooling choices made during the build. It is intended as a learning resource — each decision is explained in terms of the trade-off it resolves, not just what was chosen.

---

## Table of Contents

1. [Overall architecture philosophy](#1-overall-architecture-philosophy)
2. [Why not customize the Shopify theme directly](#2-why-not-customize-the-shopify-theme-directly)
3. [Frontend: Next.js on Vercel](#3-frontend-nextjs-on-vercel)
4. [The proxy rewrite pattern (and why CORS is irrelevant)](#4-the-proxy-rewrite-pattern-and-why-cors-is-irrelevant)
5. [Backend: FastAPI on Railway](#5-backend-fastapi-on-railway)
6. [AI: Groq + llama-3.3-70b-versatile](#6-ai-groq--llama-33-70b-versatile)
7. [Product data: local snapshot + enriched index](#7-product-data-local-snapshot--enriched-index)
8. [The enrichment pipeline](#8-the-enrichment-pipeline)
9. [LLM prompt design for the recommender](#9-llm-prompt-design-for-the-recommender)
10. [Lazy Groq client initialisation](#10-lazy-groq-client-initialisation)
11. [Category classification logic](#11-category-classification-logic)
12. [CI pipeline design](#12-ci-pipeline-design)
13. [Deployment: Railway + Vercel over alternatives](#13-deployment-railway--vercel-over-alternatives)
14. [Environment variables and secrets](#14-environment-variables-and-secrets)
15. [What was deliberately left out](#15-what-was-deliberately-left-out)

---

## 1. Overall architecture philosophy

The project is an **intelligence layer on top of an existing store** — not a replacement for it. The Shopify store handles products, checkout, payments, and fulfilment. This project adds one thing that Shopify cannot do natively: personalised AI-driven recommendations.

That constraint shaped every decision. We never touch the live store. We read from it (its public `/products.json` endpoint) but write nothing back. If this project were taken offline tomorrow, the real store would be unaffected.

The consequence is a clean separation:

```
Shopify  →  read-only data source
Backend  →  AI logic + product catalogue
Frontend →  presentation layer
```

---

## 2. Why not customize the Shopify theme directly

Shopify themes are built with Liquid (a Ruby-templating language). You can add JavaScript widgets to them, but:

- Running a Python backend from inside Shopify is impossible. Shopify apps exist for that, but building a Shopify app requires registering a Partner account, going through OAuth flows, and Shopify's approval process — far too heavy for a one-week MVP.
- Liquid themes have no native async data-fetching. Injecting an AI feature requires a separate backend regardless.
- Working in a Liquid theme requires a Shopify development store and the Shopify CLI — more setup, more friction, harder to demo.

A headless frontend side-steps all of this. We build a standalone web app that reads the same products and links directly to the Shopify checkout. From a user's perspective it looks like one product — in reality it is two systems.

---

## 3. Frontend: Next.js on Vercel

**Why Next.js over plain React or another framework:**

Next.js is a React framework that adds server-side features (routing, server components, API routes) on top of React. For this project the relevant feature is **server-side rewrites** — Next.js can proxy requests from the browser to the backend without exposing the backend URL or dealing with CORS (explained in section 4).

It also provides file-system routing (each file in `app/` becomes a URL), which meant we could add new pages (Caffetteria, Capsule, Filosofia) simply by creating new files.

**Why Vercel:**

Vercel built Next.js. Deploying a Next.js app to Vercel is one `git push`. It handles SSL, global CDN, and preview deployments for branches automatically. For a project where the owner is non-technical and continuous support must be minimal, "it deploys on push" is not a convenience — it is a requirement.

---

## 4. The proxy rewrite pattern (and why CORS is irrelevant)

This is the most important architectural decision for understanding how the two services communicate.

### The naive approach (and its problem)

The obvious implementation is: the browser calls the Railway backend directly.

```
Browser → https://coffeeriff-facelift-production.up.railway.app/recommend
```

This immediately hits the **CORS wall**. CORS (Cross-Origin Resource Sharing) is a browser security mechanism that blocks JavaScript running on one domain (e.g. `coffeeriff-facelift.vercel.app`) from calling another domain (e.g. `coffeeriff-facelift-production.up.railway.app`) unless the server explicitly allows it via response headers.

The fix seems simple: add `ALLOWED_ORIGINS` to the backend. But this introduces a dependency: every time the Vercel URL changes (new branch preview, new project), the Railway env var must be updated too. In production, forgetting this step breaks the app silently.

### The proxy pattern (what we actually built)

`next.config.js` contains a rewrite rule:

```js
async rewrites() {
  return [{
    source: "/api/:path*",
    destination: `${process.env.NEXT_PUBLIC_API_URL}/:path*`,
  }];
}
```

This means: when the browser calls `/api/recommend`, **the Next.js server** (running on Vercel's infrastructure) intercepts the request and forwards it to Railway. The browser never contacts Railway directly.

```
Browser → /api/recommend (same origin: vercel.app)
              ↓
          Next.js server on Vercel
              ↓  server-to-server call, no browser CORS rules apply
          Railway backend
```

Because the call from Next.js to Railway is server-to-server, CORS rules do not apply — CORS is a browser-only mechanism. The `ALLOWED_ORIGINS` configuration in the backend exists as a safety net for direct browser access (e.g. someone calling the Railway URL from their own code), but is not needed for the app to function.

### The trailing slash bug

The rewrite rule concatenates `NEXT_PUBLIC_API_URL` with `/:path*`. If the env var has a trailing slash:

```
https://railway.app/  +  /recommend  =  https://railway.app//recommend
```

The double slash produces a 404 or 502. This is why `NEXT_PUBLIC_API_URL` must be set **without** a trailing slash in Vercel's environment variables.

---

## 5. Backend: FastAPI on Railway

**Why FastAPI:**

FastAPI is a Python web framework built on top of Starlette (async) and Pydantic (data validation). It was chosen because:

- Python is the natural home for LLM integrations. All major AI SDKs (Groq, OpenAI, Anthropic) have first-class Python clients.
- FastAPI's async support means the server does not block while waiting for Groq to respond — critical for an endpoint that involves a network call to an external LLM API.
- Pydantic models (`models.py`) act as a contract between frontend and backend. If the response shape changes, the type error surfaces at the Python layer, not silently in the UI.
- Auto-generated OpenAPI docs (`/docs`) are useful during development without any extra work.

**Why Railway:**

Railway offers one-command Python deployments from a GitHub repo. The `railway.toml` file specifies the start command and health check path. Railway detects Python via nixpacks (its build system) and installs `requirements.txt` automatically.

The alternative was Render, which has a similar free tier but slightly slower cold starts. Railway was chosen because its dashboard provides clearer real-time log streaming, useful for debugging LLM prompt/response issues.

---

## 6. AI: Groq + llama-3.3-70b-versatile

**Why Groq:**

Groq operates custom inference hardware (LPUs — Language Processing Units) optimised for transformer inference. The result is dramatically lower latency compared to standard GPU-based cloud inference: typical time-to-first-token is under 300ms vs 1–3 seconds on OpenAI or Anthropic.

For a quiz that ends with a recommendation, latency is a UX issue. A 3-second wait before recommendations appear feels broken. Groq makes the wait imperceptible.

**Why llama-3.3-70b-versatile:**

- It is a 70B parameter model — large enough to produce fluent Italian and understand nuanced product descriptions.
- It is available on Groq's free tier, which matters for a minimal-budget project.
- It was specifically chosen after `llama3-70b-8192` (the previous version) was decommissioned by Groq mid-development. The `-versatile` variant has no hard token limit on context, which matters because the full product catalog is included in every prompt.
- It produces reliable structured JSON output, which the recommender endpoint depends on.

**Why Italian:**

The brand is Italian. The owner communicates in Italian. Making the AI respond in the same language as the brand copy creates a coherent experience. The prompt instructs the model to address the user directly using "tu" (informal Italian second-person), matching the brand's voice.

---

## 7. Product data: local snapshot + enriched index

The backend does not call the Shopify API on every request. Instead, it maintains two local JSON files:

| File | Contents | Updated |
|------|----------|---------|
| `data/products.json` | Raw Shopify product data (title, price, description, handle, image) | On startup if catalog changed |
| `data/products_enriched.json` | LLM-generated structured metadata per product | Manually via `enrich_products.py`, or automatically when catalog changes |

**Why a local snapshot instead of live Shopify API calls:**

1. **Latency.** The recommendation endpoint already calls Groq. Adding a Shopify API call in the same request would double the latency.
2. **Rate limits.** Shopify's Storefront API has rate limits. A busy demo could exhaust them.
3. **Reliability.** If Shopify has downtime, the recommender still works from cached data.
4. **No auth needed.** `coffeeriff.com/products.json` is a public unauthenticated endpoint. No Shopify API credentials are needed, which keeps the setup simple.

The startup background task (`_check_and_refresh` in `main.py`) re-fetches the live catalog and compares it by MD5 hash. If the catalog changed, it updates the snapshot and triggers re-enrichment. This means product additions in Shopify propagate to the recommendation engine automatically on the next backend restart (Railway restarts on every deploy).

---

## 8. The enrichment pipeline

Raw Shopify product data is flat and unstructured: a title, an HTML description, some tags. The recommendation LLM needs structured attributes — roast level, process (washed/natural/honey), origin country and region, brew compatibility, SCA score — to reason about product fit.

`scripts/enrich_products.py` solves this by running each product's description through a separate LLM call that extracts structured JSON:

```json
{
  "roast": "medio",
  "process": "lavato",
  "origin_country": "Etiopia",
  "origin_region": "Yirgacheffe",
  "flavor_notes": ["bergamotto", "gelsomino", "pesca"],
  "brew_compatibility": ["filtro", "aeropress"],
  "sca_score": 87,
  "bullets": ["..."]
}
```

This enriched data is merged into the catalog at load time in `products.py`. The recommendation prompt receives structured product metadata instead of raw HTML, which produces far more accurate and specific match reasons.

**Why a separate script, not inline enrichment:**

Enriching all 30+ products takes 30–60 seconds (one LLM call per product). Doing this on every request would be unusable. The enrichment is a one-time preprocessing step. The result is cached on disk and read in milliseconds at runtime.

---

## 9. LLM prompt design for the recommender

The `build_prompt` function in `recommender.py` constructs the prompt sent to Groq. Several design choices are worth explaining:

**Catalog shuffling:**

The catalog is shuffled before being included in the prompt (`random.shuffle`). LLMs exhibit primacy and recency bias — products near the start or end of a list are more likely to be picked. Shuffling on every request distributes recommendations evenly across the catalog over many quiz completions, preventing the same 3 products from being recommended every time.

**JSON-only output instruction:**

The prompt explicitly says "Rispondi SOLO con un JSON array valido, senza markdown" (reply ONLY with a valid JSON array, no markdown). Without this instruction, the model often wraps its response in markdown code fences (` ```json ... ``` `). The response parser in `get_recommendations` has a defensive strip for code fences as a fallback, but the instruction prevents it in the common case.

**Process-based deduplication:**

After resolving LLM picks to real products, the code ensures variety by allowing at most one product per processing method (washed, natural, honey, etc.). This prevents three washed Ethiopians from appearing together when the user said they wanted variety.

**Fallback mechanism:**

If the LLM returns fewer than 3 valid matches (e.g. hallucinated product names that don't resolve), `_fallback_products` fills remaining slots from the catalog filtered by brew method. The fallback uses a generic Italian match reason rather than a personalised one, but ensures the user always receives 3 results.

---

## 10. Lazy Groq client initialisation

The Groq client is not created at module import time. Instead, it is initialised on the first call to `_get_client()`:

```python
_client = None

def _get_client() -> Groq:
    global _client
    if _client is None:
        _client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    return _client
```

**Why:** If the `GROQ_API_KEY` environment variable is missing, `Groq()` raises an exception. If this happened at import time, the entire FastAPI app would fail to start — making it impossible to even see the health check or products endpoint. Lazy initialisation means the server starts and responds normally to all routes; only the `/recommend` endpoint fails when called without a key. This is useful during development (you can browse products without a Groq key) and makes missing-key errors more visible and debuggable.

---

## 11. Category classification logic

The Shopify catalog has inconsistent `product_type` values: some products are tagged `"Caffè"` (with accent), some `"CAFFE'"` (uppercase, with apostrophe), some `""` (empty). Capsule products are filed under `"CAFFE'"` but are a fundamentally different product.

`products.py::_get_category` normalises this:

```python
if ptype == "caffe'":
    if "capsul" in title_lower or "nespresso" in title_lower:
        return "capsule"
    return "coffee"
if ptype in ("caffè", "caffe"):
    return "coffee"
if ptype == "":
    if "macinacaff" in title_lower or "grinder" in title_lower:
        return None  # skip grinder
    if "miscela" in title_lower:
        return "coffee"
    return "accessory"
```

The grinder is explicitly excluded (`return None`) because recommending a grinder in response to "which coffee should I buy?" is nonsensical. This classification is the single place where the messy real-world Shopify data is normalised into clean categories that the rest of the app depends on.

---

## 12. CI pipeline design

The GitHub Actions workflow (`.github/workflows/ci.yml`) runs three independent jobs in parallel on every push to `main` or any `feat/**` branch:

```
push → backend-lint (ruff)
     → backend-test (pytest)
     → frontend     (lint + type-check + build)
```

**Why three separate jobs instead of one:**

Separate jobs fail independently. If the frontend build breaks but the backend tests pass, you know exactly which half is broken without reading through a long serial log. They also run in parallel, so total CI time is the duration of the slowest job, not the sum of all three.

**Why ruff for linting:**

Ruff is a Python linter written in Rust. It runs in milliseconds on a small codebase like this (vs 2–5 seconds for flake8 or pylint). It is installed standalone (`pip install ruff`) without needing the full application dependencies, keeping the lint job fast and isolated.

**Why Groq is mocked in tests:**

Real Groq API calls are non-deterministic (different responses each run), slow (adds 2–3 seconds per test), and require a real API key in CI secrets. The tests mock the Groq client and assert on the logic around it (prompt construction, JSON parsing, fallback behaviour) — not on the LLM's output. This makes tests fast, free, and deterministic.

**The `NEXT_PUBLIC_API_URL` placeholder in CI:**

The frontend `next.config.js` uses `NEXT_PUBLIC_API_URL` in a rewrite rule. At build time, Next.js checks that the value is defined. In CI there is no real backend, so the workflow sets it to a placeholder (`https://placeholder.example.com`). The value is never called during a build — it is only used at runtime — so the placeholder is safe for the build/type-check step.

---

## 13. Deployment: Railway + Vercel over alternatives

| Alternative | Why not chosen |
|-------------|---------------|
| **Heroku** | Free tier was discontinued in 2022. Paid plans start at $7/month with slow cold starts. |
| **AWS/GCP/Azure** | Serious operational overhead. Requires VPCs, IAM roles, load balancers. Disproportionate for an MVP. |
| **Fly.io** | Excellent, but requires Docker. Railway's nixpacks auto-detects Python and builds without a Dockerfile — fewer things to maintain. |
| **Self-hosted VPS** | Owner is non-technical. A VPS requires SSH access, OS updates, process management (systemd/supervisor), and manual SSL setup. None of this is sustainable without ongoing developer involvement. |
| **Netlify** (instead of Vercel) | Netlify supports Next.js but Vercel's support is first-party. Server-side rewrites (the proxy pattern) are more reliably supported on Vercel. |

The guiding principle: both platforms deploy from `git push` to `main` with zero manual steps. This is the correct model for a project with minimal ongoing developer involvement.

---

## 14. Environment variables and secrets

The project uses three secrets:

| Variable | Where | Purpose |
|----------|-------|---------|
| `GROQ_API_KEY` | Railway | Authenticates calls to the Groq LLM API |
| `NEXT_PUBLIC_API_URL` | Vercel | Tells the Next.js rewrite rule where to proxy `/api/*` requests |
| `ALLOWED_ORIGINS` | Railway | (Optional) allows direct browser-to-Railway calls for debugging |

**Why `NEXT_PUBLIC_API_URL` is a `NEXT_PUBLIC_` variable:**

In Next.js, environment variables are server-side by default and not exposed to browser JavaScript. Variables prefixed with `NEXT_PUBLIC_` are injected into the client bundle at build time and are visible in the browser.

In this architecture the variable is used in `next.config.js` (server-side rewrite rule) and in `lib/api.ts` (client-side fetch calls during development). The `NEXT_PUBLIC_` prefix is slightly over-permissive for the production case (where only the server needs it), but it is the correct prefix for the development case where the frontend calls the backend directly.

**The trailing slash rule:**

Both `NEXT_PUBLIC_API_URL` and `ALLOWED_ORIGINS` must be set **without** trailing slashes. The rewrite destination is constructed as `${NEXT_PUBLIC_API_URL}/:path*` — a trailing slash produces a double-slash URL that breaks routing on Railway.

---

## 15. What was deliberately left out

Understanding what was not built is as important as understanding what was.

**No database.** Products are stored in flat JSON files. A PostgreSQL database would add connection management, migrations, and a second service to keep healthy — none of which improve the user experience of a read-only recommendation feature.

**No user accounts or sessions.** The quiz is stateless. There is nothing to remember between sessions. Adding auth would require a database, session management, and email flows — weeks of work for no visible benefit in the demo.

**No Shopify API credentials.** The product data comes from `coffeeriff.com/products.json`, a public unauthenticated endpoint. Using the official Shopify Storefront API would require registering a Shopify app, generating access tokens, and handling token rotation. The public endpoint provides everything needed (title, price, image, handle) without any of that.

**No webhook integration.** Shopify webhooks can notify the backend when products change. For an MVP that already auto-refreshes on startup, webhooks add operational complexity (HMAC signature verification, endpoint registration, retry handling) with minimal benefit.

**No streaming LLM responses.** The `/recommend` endpoint waits for the full Groq response before returning. Streaming would let the UI show results as they arrive, improving perceived performance. It was left out because it significantly complicates the response parsing (the JSON must be reassembled from a stream) and the quiz UX already has a loading spinner that makes the wait feel intentional.

**No analytics.** Adding event tracking (Mixpanel, PostHog, GA4) would reveal which quiz answers are most common, which products are recommended most, and where users drop off. This is high value for the owner but adds a third-party dependency and data privacy considerations that are disproportionate for a live demo.
