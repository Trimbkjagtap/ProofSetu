# Member 4 Handoff — Checklist, Packet, Safety, Integration & Deployment

- **Branch / latest commit:** `feat/checklist-packet-safety` → merged to `develop` via PR #4 (squash `9571e64`); deploy config via PR #5 (`97498cd`).
- **Owner:** Member 4 (integration owner).
- **Live backend:** https://proofsetu.onrender.com  (health: `/health`, docs: `/docs`)

## Endpoints delivered
| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Liveness check (wake before demo) |
| POST | `/session` | Anonymous consented session + TTL |
| DELETE | `/session/{id}` | Flush session, packets, and confirmed fields |
| GET | `/checklist?program=lihtc` | Deterministic present/missing/expiring/expired + fixHint |
| POST | `/packet` | Assemble packet from confirmed fields only |
| GET | `/packet/{id}` | Packet preview (confirmed fields) |
| GET | `/packet/{id}/pdf` | Renter-initiated PDF (marks `downloaded`); HTML fallback |
| GET | `/packet/{id}/html` | Accessible HTML packet |
| GET | `/features` | Feature registry: field + purpose + retention + delete control |
| GET | `/profile` | Confirmed fields only |
| POST | `/rules/query` | Member 3's rules, mounted here + wrapped by the output guard |

Plus a global **OutputGuardMiddleware**: eligibility questions → mandated refusal; every JSON response scanned for verdict language.

## Contract versions consumed
`contracts/checklist-response.json`, `contracts/packet-response.json`, `contracts/rules-response.json` — property names unchanged.

## Environment variable names (no values)
`SESSION_BACKEND`, `SESSION_TTL_SECONDS`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `MAX_UPLOAD_MB`, `OCR_PROVIDER`, `VISION_PROVIDER`, `RULE_INDEX`, `CORS_ORIGINS`, `PYTHON_VERSION` (deploy).
Safe defaults exist for all — the app runs with **none** set.

## Run command (local, from repo root)
```bash
python3 -m venv backend/.venv && source backend/.venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload          # http://localhost:8000/docs
```

## Test command and result
```bash
pytest -q
```
**67 passing** (session, checklist, guards, packet, features/profile, hardening) + Member 3's 22 rules tests. CI runs the same on every PR to `develop` (green).

## Fixture / fallback behavior
- Sessions: **in-memory** store (`SESSION_BACKEND=memory`); Upstash is an interface stub.
- PDF: **fpdf2** (pure Python); falls back to accessible **HTML** if PDF rendering fails.
- OCR/vision/rule-index: `fixture` / `keyword` defaults — no external API needed.
- Checklist / packet / profile use **demo profiles** until live extraction + `PATCH /documents/{id}/fields` are wired.
- `_try_include` mounts `backend.rules.router` and `backend.extraction.api` **only if present** — they light up automatically when merged.

## Import convention (team)
`backend` is a package; import `backend.<area>.<module>` (absolute) across packages, relative within. Run `uvicorn backend.main:app` from the repo root. `pytest.ini` sets `pythonpath = .`.

## Integration status
- ✅ Member 3 (rules) merged (PR #3) and wired; verified through the output guard.
- ⏳ Member 2 (extraction) not merged — router auto-mounts on merge; then wire `PATCH /documents/{id}/fields` to populate the profile store (replaces the demo fallbacks).
- ⏳ Member 1 (frontend) — set `NEXT_PUBLIC_API_BASE_URL=https://proofsetu.onrender.com`; after Vercel deploy, set backend `CORS_ORIGINS` to the Vercel origin and redeploy.

## Known limitations
- Free Render service sleeps after ~15 min idle (wake `/health` before demos).
- Auto-deploy webhook may not fire (Render lacks GitHub-app access to the repo) — use Manual Deploy, or have the owner approve the app.
- Confirmed profile is a demo fallback until `PATCH /documents/{id}/fields` is integrated.

## Rollback note
- Revert the squash commit on `develop` (never touch `main`).
- Emergency demo: frontend `NEXT_PUBLIC_USE_MOCKS=true` runs the full journey on fixtures.
- Stable commits: backend `9571e64`, deploy `97498cd`.
