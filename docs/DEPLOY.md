# Deployment Guide

Deploy from the **`develop`** branch only. `main` stays untouched.

## Backend — Render (free)

The repo ships a [`render.yaml`](../render.yaml) blueprint, so Render can configure
the service for you.

1. Sign up at https://render.com with **GitHub** (free, no card).
2. **New → Blueprint** → select the `Trimbkjagtap/ProofSetu` repo.
3. Render reads `render.yaml` and proposes a **`proofsetu-api`** web service on the
   free plan, deploying from `develop`. Click **Apply / Create**.
4. Wait for the first build (installs `backend/requirements.txt`, then runs
   `uvicorn backend.main:app`). ~2–3 minutes.
5. Verify: open `https://<your-service>.onrender.com/health` → `{"status":"ok",...}`.
   Also try `/docs` for the interactive API page.

**Manual alternative** (if you skip the blueprint): New → Web Service → connect repo →
Runtime **Python**, Branch **develop**, Build `pip install -r backend/requirements.txt`,
Start `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`, Health check `/health`.
Add the env vars listed in `render.yaml`.

### Free-tier notes
- The service **sleeps after ~15 min idle** and takes ~30–60s to wake. **Open
  `/health` 2–3 minutes before any demo/rehearsal.**
- The filesystem is ephemeral — fine here (sessions/packets are in-memory).

## Frontend — Vercel (free)

Member 1 deploys the Next.js app from `develop` on Vercel and sets
`NEXT_PUBLIC_API_BASE_URL` to the Render backend URL above.

## Wire CORS (after the frontend URL exists)

The backend must allow the frontend origin. In Render → the service → **Environment**,
set `CORS_ORIGINS` to the exact Vercel URL (e.g. `https://proofsetu.vercel.app`) and
redeploy. Until then it defaults to `localhost:3000` for local dev.

## Environment variables (names only — never commit secrets)

| Variable | Value | Notes |
|---|---|---|
| `SESSION_BACKEND` | `memory` | `upstash` optional (not required for demo) |
| `SESSION_TTL_SECONDS` | `3600` | session lifetime |
| `MAX_UPLOAD_MB` | `10` | upload cap |
| `OCR_PROVIDER` | `fixture` | `textract`/`tesseract` optional (Member 2) |
| `VISION_PROVIDER` | `fixture` | `openai`/`gemini` optional (Member 2) |
| `RULE_INDEX` | `keyword` | `chroma`/`faiss` optional (Member 3) |
| `CORS_ORIGINS` | *(empty → set to Vercel URL)* | exact frontend origin |

## Emergency fallback
If the live backend breaks, the frontend can set `NEXT_PUBLIC_USE_MOCKS=true` to run
the full journey against the contract fixtures.
