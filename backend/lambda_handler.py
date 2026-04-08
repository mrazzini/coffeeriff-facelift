"""
AWS Lambda entry point.
Wraps the existing FastAPI app with Mangum so it can handle
API Gateway (HTTP API) events.
"""
from mangum import Mangum

from app.main import app

handler = Mangum(app, lifespan="off")
