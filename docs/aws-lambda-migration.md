# Migrating the Coffeeriff Backend from Railway to AWS Lambda

## Overview

This guide walks through moving the FastAPI backend from a Railway container to a
single AWS Lambda function fronted by API Gateway. The core business logic
(recommender, quiz config, product loading) stays untouched. Changes are limited
to infrastructure plumbing: how the app boots, where it reads data, and how
catalog refresh is triggered.

### Architecture: before and after

```
BEFORE (Railway)
────────────────
Vercel (Next.js)  ──rewrites /api/*──►  Railway container
                                         ├─ FastAPI + Uvicorn (always-on)
                                         ├─ In-memory product cache
                                         ├─ Startup background task (Shopify refresh)
                                         └─ Local JSON files (products.json, products_enriched.json)

AFTER (AWS Lambda)
──────────────────
Vercel (Next.js)  ──rewrites /api/*──►  API Gateway (HTTP API)
                                         └─ Lambda function
                                             ├─ FastAPI + Mangum adapter
                                             ├─ Reads product data from S3 (or bundled JSON)
                                             └─ No startup background task

EventBridge (cron)  ──daily──►  Lambda function (catalog-refresh)
                                 ├─ Fetches Shopify catalog
                                 ├─ Enriches via Groq if changed
                                 └─ Writes updated JSON to S3
```

---

## Prerequisites

- An AWS account with permissions for Lambda, API Gateway, S3, IAM,
  EventBridge, and CloudWatch Logs.
- AWS CLI v2 installed and configured (`aws configure`).
- AWS SAM CLI installed (`pip install aws-sam-cli` or via Homebrew).
- Python 3.11 on your machine (to match the Lambda runtime).

---

## Step 1 — Install the Mangum adapter

Mangum translates API Gateway events into ASGI requests that FastAPI understands.
It's a single dependency with zero config.

```bash
cd backend
pip install mangum
```

Add it to `requirements.txt`:

```
mangum==0.19.0
```

---

## Step 2 — Add the Lambda handler entry point

Create a new file `backend/lambda_handler.py`:

```python
"""
AWS Lambda entry point.
Wraps the existing FastAPI app with Mangum so it can handle
API Gateway (HTTP API) events.
"""
from mangum import Mangum

from app.main import app

handler = Mangum(app, lifespan="off")
```

Key detail: `lifespan="off"` disables FastAPI's startup/shutdown events inside
Lambda. The Railway startup hook (`_check_and_refresh`) should NOT run on every
Lambda cold start — catalog refresh is handled separately (Step 5).

---

## Step 3 — Modify product data loading to support S3

Currently `products.py` and `main.py` read JSON from local disk via
`Path(__file__).parent.parent / "data"`. In Lambda you have two options:

### Option A — Bundle the JSON files in the deployment package (simplest)

The `data/` directory ships inside the Lambda zip. The existing code works
as-is because Lambda extracts the zip to `/var/task/` and relative paths
resolve correctly.

**Pros:** Zero code changes to `products.py`.
**Cons:** Updating product data requires redeploying the Lambda, unless you
combine it with S3 reads.

This is the recommended starting point. The JSON files are ~100 KB total — well
within Lambda's 250 MB unzipped limit.

### Option B — Read from S3 at runtime

Replace local file reads with S3 reads. This decouples data updates from code
deployments — the refresh Lambda (Step 5) writes to S3 and the API Lambda reads
from it.

Changes needed in `backend/app/products.py`:

```python
import json
import logging
import os

import boto3

logger = logging.getLogger(__name__)

_BUCKET = os.environ["DATA_BUCKET"]       # e.g. "coffeeriff-data"
_PRODUCTS_KEY = "products.json"
_ENRICHED_KEY = "products_enriched.json"

_s3 = boto3.client("s3")
_catalog: list[dict] | None = None


def _read_s3_json(key: str) -> dict | list:
    """Read and parse a JSON file from S3."""
    obj = _s3.get_object(Bucket=_BUCKET, Key=key)
    return json.loads(obj["Body"].read().decode("utf-8"))


def load_enriched() -> dict[str, dict]:
    try:
        return _read_s3_json(_ENRICHED_KEY)
    except _s3.exceptions.NoSuchKey:
        logger.warning("products_enriched.json not found in S3")
        return {}


def invalidate_cache() -> None:
    global _catalog
    _catalog = None


def load_products(category: str | None = None) -> list[dict]:
    global _catalog
    if _catalog is None:
        all_products = _read_s3_json(_PRODUCTS_KEY)
        enriched = load_enriched()
        _catalog = []
        for p in all_products:
            cat = _get_category(p)
            if cat is None:
                continue
            p["enriched"] = enriched.get(p["handle"], {})
            p["category"] = cat
            _catalog.append(p)
    if category:
        return [p for p in _catalog if p.get("category") == category]
    return _catalog
```

Keep `_get_category()` and `get_product_summary()` as they are — they have no
file I/O.

**Note:** The `_catalog` global persists across invocations on the same warm
Lambda instance, so you get the same in-memory caching behavior as Railway.
Cold starts will re-read from S3, adding ~50-100 ms for these small files.

If you go with Option B, also add `boto3` to `requirements.txt`:

```
boto3==1.35.0
```

(Lambda ships with `boto3` pre-installed, but pinning avoids version surprises.)

---

## Step 4 — Remove the startup catalog refresh from main.py

The `@app.on_event("startup")` handler and all the helper functions it calls
(`_check_and_refresh`, `_fetch_shopify`, `_run_enrichment`, `_catalog_hash`,
`_strip_html`) are Railway-specific. In the Lambda model, catalog refresh is a
separate scheduled function (Step 5).

Edit `backend/app/main.py`:

1. **Remove** these functions entirely:
   - `_strip_html()`
   - `_catalog_hash()`
   - `_fetch_shopify()`
   - `_run_enrichment()`
   - `_check_and_refresh()`

2. **Remove** the `startup()` event handler (lines 130-138).

3. **Remove** unused imports that were only needed by those functions:
   `asyncio`, `hashlib`, `json`, `re`, `sys`, `httpx`.

4. **Keep** everything else: the `app` instance, CORS middleware, and the four
   route handlers.

After cleanup, `main.py` should look roughly like:

```python
import logging
import os
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from .models import QuizAnswers, QuizConfig, Recommendation
from .recommender import get_recommendations
from .products import load_products, load_enriched
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
```

---

## Step 5 — Create the catalog refresh Lambda

This replaces the Railway startup background task. It runs on a schedule
(e.g. once a day) via EventBridge.

Create `backend/refresh_handler.py`:

```python
"""
Scheduled Lambda: fetch Shopify catalog, compare with S3 copy,
re-enrich via Groq if changed, upload updated files to S3.
"""
import hashlib
import json
import logging
import os
import re
import time

import boto3
import httpx
from groq import Groq

logger = logging.getLogger("coffeeriff.refresh")
logger.setLevel(logging.INFO)

BUCKET = os.environ["DATA_BUCKET"]
SHOPIFY_URL = "https://coffeeriff.com/products.json"
PRODUCTS_KEY = "products.json"
ENRICHED_KEY = "products_enriched.json"

s3 = boto3.client("s3")


def _strip_html(html: str) -> str:
    text = re.sub(r"<[^>]+>", " ", html)
    text = re.sub(r"&[a-z]+;", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def _catalog_hash(products: list[dict]) -> str:
    key = "|".join(f"{p['handle']}:{p['title']}" for p in products)
    return hashlib.md5(key.encode()).hexdigest()


def _fetch_shopify() -> list[dict]:
    parsed = []
    page = 1
    with httpx.Client(verify=False, timeout=30) as client:
        while True:
            resp = client.get(f"{SHOPIFY_URL}?page={page}&limit=250")
            resp.raise_for_status()
            raw_list = resp.json().get("products", [])
            if not raw_list:
                break
            for raw in raw_list:
                body = _strip_html(raw.get("body_html", ""))
                variant = raw.get("variants", [{}])[0]
                images = raw.get("images", [])
                tags = raw.get("tags", [])
                parsed.append({
                    "title": raw["title"],
                    "handle": raw["handle"],
                    "description": body,
                    "price": variant.get("price", "0.00"),
                    "tags": ", ".join(tags) if isinstance(tags, list) else tags,
                    "image_url": images[0]["src"] if images else "",
                    "images": [img["src"] for img in images],
                    "product_type": raw.get("product_type", ""),
                    "vendor": raw.get("vendor", ""),
                })
            page += 1
    return parsed


def _read_s3_json(key: str):
    try:
        obj = s3.get_object(Bucket=BUCKET, Key=key)
        return json.loads(obj["Body"].read().decode("utf-8"))
    except s3.exceptions.NoSuchKey:
        return None


def _write_s3_json(key: str, data) -> None:
    s3.put_object(
        Bucket=BUCKET,
        Key=key,
        Body=json.dumps(data, ensure_ascii=False, indent=2).encode("utf-8"),
        ContentType="application/json",
    )


def _enrich_batch(client: Groq, batch: list[dict]) -> list[dict]:
    """Identical logic to scripts/enrich_products.py — send a batch to Groq."""
    # Import the system prompt from the existing script would couple the two;
    # for Lambda isolation, inline a minimal version or import it.
    # For brevity here, reuse the same prompt from enrich_products.py.
    from scripts.enrich_products import SYSTEM_PROMPT

    payload = [
        {
            "handle": p["handle"],
            "title": p["title"],
            "description": p.get("description", "")[:600],
            "tags": p.get("tags", ""),
        }
        for p in batch
    ]

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": json.dumps(payload, ensure_ascii=False)},
        ],
        temperature=0.1,
        max_tokens=2048,
    )
    raw = response.choices[0].message.content.strip()
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1]
        raw = raw.rsplit("```", 1)[0].strip()
    return json.loads(raw)


def _run_enrichment(products: list[dict]) -> dict[str, dict]:
    """Enrich all products via Groq, return enriched dict keyed by handle."""
    groq = Groq(api_key=os.environ["GROQ_API_KEY"])
    enriched = _read_s3_json(ENRICHED_KEY) or {}

    pending = [p for p in products if p["handle"] not in enriched]
    if not pending:
        logger.info("All products already enriched.")
        return enriched

    logger.info("Enriching %d new products...", len(pending))
    batch_size = 5
    batches = [pending[i:i + batch_size] for i in range(0, len(pending), batch_size)]

    for i, batch in enumerate(batches):
        try:
            results = _enrich_batch(groq, batch)
            for item in results:
                handle = item.get("handle")
                if handle:
                    enriched[handle] = {k: v for k, v in item.items() if k != "handle"}
        except Exception as e:
            logger.error("Batch %d failed: %s", i + 1, e)
        if i < len(batches) - 1:
            time.sleep(1)

    return enriched


def handler(event, context):
    """Lambda entry point — triggered by EventBridge schedule."""
    logger.info("Fetching Shopify catalog...")
    live = _fetch_shopify()

    cached = _read_s3_json(PRODUCTS_KEY)
    if cached and _catalog_hash(live) == _catalog_hash(cached):
        logger.info("Catalog unchanged. No action needed.")
        return {"statusCode": 200, "body": "unchanged"}

    logger.info("Catalog changed — updating S3 and re-enriching...")
    _write_s3_json(PRODUCTS_KEY, live)

    enriched = _run_enrichment(live)
    _write_s3_json(ENRICHED_KEY, enriched)

    logger.info("Refresh complete. %d products, %d enriched.", len(live), len(enriched))
    return {"statusCode": 200, "body": f"updated: {len(live)} products"}
```

> **Lambda timeout:** The enrichment step calls Groq in batches and can take
> 30-60 seconds. Set this Lambda's timeout to **5 minutes** (the API Lambda
> can stay at the default 30 seconds).

---

## Step 6 — SAM template (Infrastructure as Code)

Create `backend/template.yaml`:

```yaml
AWSTemplateFormatVersion: "2010-09-09"
Transform: AWS::Serverless-2016-10-31
Description: Coffeeriff AI Recommender — serverless backend

Globals:
  Function:
    Runtime: python3.11
    Timeout: 30
    MemorySize: 256
    Environment:
      Variables:
        GROQ_API_KEY: !Ref GroqApiKey
        ALLOWED_ORIGINS: !Ref AllowedOrigins

Parameters:
  GroqApiKey:
    Type: String
    NoEcho: true
    Description: Groq API key for LLM calls
  AllowedOrigins:
    Type: String
    Default: "http://localhost:3000,https://coffeeriff-quiz.vercel.app"
    Description: Comma-separated CORS origins
  DataBucketName:
    Type: String
    Default: "coffeeriff-data"
    Description: S3 bucket for product data

Resources:
  # ── S3 bucket for product data ──────────────────────────────────────────
  DataBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Ref DataBucketName

  # ── API Lambda ──────────────────────────────────────────────────────────
  ApiFunction:
    Type: AWS::Serverless::Function
    Properties:
      Handler: lambda_handler.handler
      CodeUri: .
      Description: Coffeeriff API (FastAPI + Mangum)
      MemorySize: 512
      Timeout: 30
      Environment:
        Variables:
          DATA_BUCKET: !Ref DataBucketName
      Policies:
        - S3ReadPolicy:
            BucketName: !Ref DataBucketName
      Events:
        Api:
          Type: HttpApi
          Properties:
            ApiId: !Ref HttpApi

  # ── HTTP API (API Gateway v2) ───────────────────────────────────────────
  HttpApi:
    Type: AWS::Serverless::HttpApi
    Properties:
      StageName: "$default"
      CorsConfiguration:
        AllowOrigins:
          - "*"
        AllowMethods:
          - GET
          - POST
          - OPTIONS
        AllowHeaders:
          - "*"

  # ── Catalog refresh Lambda ──────────────────────────────────────────────
  RefreshFunction:
    Type: AWS::Serverless::Function
    Properties:
      Handler: refresh_handler.handler
      CodeUri: .
      Description: Shopify catalog refresh + Groq enrichment
      MemorySize: 512
      Timeout: 300  # 5 minutes — enrichment can be slow
      Environment:
        Variables:
          DATA_BUCKET: !Ref DataBucketName
      Policies:
        - S3CrudPolicy:
            BucketName: !Ref DataBucketName
      Events:
        DailyRefresh:
          Type: Schedule
          Properties:
            Schedule: rate(1 day)
            Description: Daily Shopify catalog refresh
            Enabled: true

Outputs:
  ApiUrl:
    Description: API Gateway endpoint URL
    Value: !Sub "https://${HttpApi}.execute-api.${AWS::Region}.amazonaws.com"
  DataBucketArn:
    Description: S3 data bucket ARN
    Value: !GetAtt DataBucket.Arn
```

---

## Step 7 — Build and deploy

### 7.1 — First-time setup

```bash
cd backend

# Create an S3 bucket for SAM deployment artifacts (one-time)
aws s3 mb s3://coffeeriff-sam-artifacts --region eu-south-1

# Upload the initial product data to the data bucket
aws s3 cp data/products.json s3://coffeeriff-data/products.json
aws s3 cp data/products_enriched.json s3://coffeeriff-data/products_enriched.json
```

### 7.2 — Build

```bash
sam build
```

SAM reads `template.yaml`, installs Python dependencies from `requirements.txt`,
and packages everything into `.aws-sam/build/`.

### 7.3 — Deploy

```bash
sam deploy \
  --guided \
  --stack-name coffeeriff-backend \
  --region eu-south-1 \
  --parameter-overrides \
    GroqApiKey=your-groq-api-key \
    AllowedOrigins="https://coffeeriff-quiz.vercel.app" \
    DataBucketName=coffeeriff-data
```

The `--guided` flag walks you through confirmation prompts on the first deploy
and saves your choices to `samconfig.toml`. Subsequent deploys only need:

```bash
sam deploy
```

After deployment, SAM outputs the API Gateway URL. It will look like:

```
https://abc123def4.execute-api.eu-south-1.amazonaws.com
```

---

## Step 8 — Update the Vercel frontend

In Vercel's project settings (or `.env.production`), update the backend URL:

```
NEXT_PUBLIC_API_URL=https://abc123def4.execute-api.eu-south-1.amazonaws.com
```

The existing `next.config.js` rewrite rule already proxies `/api/*` to this URL,
so no frontend code changes are needed.

---

## Step 9 — Update tests

The existing tests in `backend/tests/test_api.py` use `httpx.AsyncClient` with
`ASGITransport(app=app)` — this tests the FastAPI app directly, not the Lambda
handler, so they continue to work unchanged.

If you want to add a Lambda-specific integration test:

```python
# tests/test_lambda.py
import json
from lambda_handler import handler


def test_lambda_health():
    event = {
        "requestContext": {"http": {"method": "GET", "path": "/"}},
        "rawPath": "/",
        "headers": {},
        "isBase64Encoded": False,
    }
    response = handler(event, None)
    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    assert body["status"] == "ok"
```

---

## Step 10 — CI/CD updates

Update `.github/workflows/ci.yml` to add a deploy step (optional — you can
also deploy manually with `sam deploy`).

Add after the existing `backend-test` job:

```yaml
  backend-deploy:
    name: Deploy backend to AWS Lambda
    needs: [backend-lint, backend-test]
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: backend
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"

      - uses: aws-actions/setup-sam@v2

      - uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: eu-south-1

      - run: sam build
      - run: sam deploy --no-confirm-changeset --no-fail-on-empty-changeset
```

Required GitHub secrets:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

---

## Step 11 — Decommission Railway

Once the Lambda deployment is verified and the Vercel frontend is pointing to
the new API Gateway URL:

1. Run a smoke test: hit all four endpoints via the new URL.
2. Remove the Railway service from the Railway dashboard.
3. Delete `backend/railway.toml` and `backend/Procfile` from the repo.
4. Remove the `invalidate_cache` import from `main.py` (only needed by the
   removed startup task).

---

## File change summary

| File | Action |
|---|---|
| `backend/requirements.txt` | Add `mangum`, optionally `boto3` |
| `backend/lambda_handler.py` | **New** — Mangum wrapper |
| `backend/refresh_handler.py` | **New** — scheduled catalog refresh |
| `backend/template.yaml` | **New** — SAM infrastructure template |
| `backend/app/main.py` | Remove startup task and refresh helpers |
| `backend/app/products.py` | (Option B only) Replace file reads with S3 |
| `backend/railway.toml` | **Delete** after migration |
| `backend/Procfile` | **Delete** after migration |
| `.github/workflows/ci.yml` | Add deploy job (optional) |
| Vercel env vars | Update `NEXT_PUBLIC_API_URL` |

---

## Cost estimate

| Resource | Free tier | Expected cost |
|---|---|---|
| Lambda | 1M requests + 400K GB-s/month | $0 (quiz traffic is low) |
| API Gateway (HTTP API) | 1M requests/month for 12 months | $0 |
| S3 | 5 GB storage + 20K GET/month | $0 |
| EventBridge | 14M invocations/month | $0 |
| CloudWatch Logs | 5 GB ingestion/month | $0 |
| **Total** | | **~$0/month** |

---

## Gotchas and tips

- **Cold starts:** FastAPI + Mangum cold starts are typically 1-2 seconds.
  The `/recommend` endpoint then adds Groq API latency (~1-3 s). Users won't
  notice because they already wait for the LLM response. If cold starts ever
  become a problem, enable Lambda Provisioned Concurrency (adds cost).

- **Lambda package size:** Keep the deployment zip lean. Exclude `tests/`,
  `scripts/`, `__pycache__/`, `.env`, and `ruff`. Add a `.samignore` or
  configure `CodeUri` patterns in `template.yaml`.

- **CORS:** API Gateway v2 (HTTP API) handles CORS at the gateway level via
  `CorsConfiguration` in the SAM template. You can remove the FastAPI CORS
  middleware if you want, but keeping both is harmless and useful for local dev.

- **Local development:** Nothing changes. Run `uvicorn app.main:app --reload`
  locally as before. Mangum is only invoked when Lambda calls `handler()`.

- **SAM local testing:** You can test the Lambda locally with:
  ```bash
  sam local start-api
  ```
  This spins up a local API Gateway + Lambda emulator using Docker.

- **Region choice:** `eu-south-1` (Milan) is used in the examples for low
  latency to Italian users. Adjust to your preference.
