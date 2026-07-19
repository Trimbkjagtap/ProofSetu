"""Standalone dev app for the extraction module — LOCAL USE ONLY.

Member 4 owns the real backend/main.py. This lets Member 2 run and test the
extraction endpoints in isolation before integration.

Run from the repo root:
    uvicorn backend.extraction.dev_app:app --reload --port 8001

Then:
    POST  http://localhost:8001/documents          (multipart file upload)
    PATCH http://localhost:8001/documents/{id}/fields
    GET   http://localhost:8001/extraction/health
"""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api import router

app = FastAPI(title="RealDoor Extraction (dev)", version="0.1.0")

# Permissive CORS for local frontend dev only. Production CORS is Member 4's.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
