# Member 2 Handoff — Document Extraction & Source Evidence

- **Branch / latest commit:** `feat/extraction`
- **Files changed:** `backend/extraction/**` (new module), `docs/handoffs/member-2.md`
- **Endpoint(s) delivered:**
  - `POST /documents` — upload → validate → classify → extract allowlisted fields + confidence + source boxes. Accepts an optional `session_id` form field to bind the document to a session.
  - `PATCH /documents/{doc_id}/fields` — confirm/correct a field; returns updated doc + `derivedStale` flag. **Now wired (Member 2 + 4):** when the document has a `session_id`, the verified field is pushed into `profile_store` so `GET /profile` returns it (replaces the demo fallback).
  - `GET /extraction/features` — content-free field metadata (field, purpose, retention) for Member 4's canonical `/features` registry.
  - `GET /extraction/health` — module liveness.
- **Document types supported:** all four — `pay_stub`, `government_id` (expired-ID demo), `benefit_letter`, `bank_statement`. Each has a deterministic fixture and a line-aware real-OCR mapping path. Extracted field set (19) matches `registry/features.json` exactly; `government_id.date_of_birth` is intentionally NOT extracted (data minimization; not published in /features).
- **Synthetic demo assets:** `data/synthetic/{pay_stub,government_id,benefit_letter,bank_statement}_demo.png` (all fictional). Regenerate with `python -m backend.extraction.tools.make_synthetic`.
- **Contract version consumed:** `contracts/extraction-response.json` (frozen v1). Response serialized with exact property names (`documentId`, `documentType`, `sourceBox`).
- **Environment variable names (no values):** `OCR_PROVIDER` (`fixture`|`tesseract`|`google`|`textract`), `GOOGLE_VISION_API_KEY` (secret), `GOOGLE_VISION_TIMEOUT_SECONDS` (default `30`), `MAX_UPLOAD_MB`, `VISION_PROVIDER` (`openai`|`gemini`|`fixture`), `OPENAI_API_KEY` (secret), `OPENAI_VISION_MODEL` (default `gpt-4o-mini`), `OPENAI_MAX_CALLS` (default `50`), `OPENAI_TIMEOUT_SECONDS` (default `30`).
- **Vision extraction (OpenAI):** with `VISION_PROVIDER=openai` and `OPENAI_API_KEY` set, `POST /documents` reads real images **and PDFs** (rasterized via PyMuPDF — no system binaries, works on Render). Structured Outputs, temperature 0, allowlist-scoped prompt, document treated as untrusted data. Any failure (missing key / API error / invalid JSON / call-cap / timeout) falls back to the deterministic fixture. Default stays `fixture` (opt-in). Source boxes are None on this path.
- **OCR via Google Cloud Vision:** with `OCR_PROVIDER=google` and `GOOGLE_VISION_API_KEY` set, `POST /documents` runs Google Vision `DOCUMENT_TEXT_DETECTION` (REST, API-key auth — HTTPS only, Render-friendly) for images **and PDFs** (per-page via PyMuPDF). Returns word-level pixel boxes → the existing mapper produces **real `sourceBox` evidence**. Any failure (no key / HTTP error / no text) → fixture fallback. **No new dependency** (stdlib `urllib` + existing `pymupdf`). Env: `GOOGLE_VISION_API_KEY` (secret), optional `GOOGLE_VISION_TIMEOUT_SECONDS` (default 30). Recommended runtime for real evidence boxes: `OCR_PROVIDER=google` + `VISION_PROVIDER=fixture`.
- **Run command (from repo root):**
  ```bash
  pip install -r backend/extraction/requirements.txt
  uvicorn backend.extraction.dev_app:app --reload --port 8001
  ```
- **Test command and result:**
  ```bash
  pytest -q backend/extraction/tests
  ```
  → **90 passed, 8 skipped** (skips are real-Tesseract tests that auto-run once the engine binary is installed). Covers MIME accept/reject, magic-byte content sniffing (renamed-exe rejection), low-confidence→please_check, injection ignored, ID last-4 only, source box present, contract keys, no forbidden tokens, POST/PATCH endpoints, line-aware mapping for all four document types, and end-to-end prompt-injection hardening.
- **Fixture/fallback behavior:** Fixture-first. With `OCR_PROVIDER=fixture` (default) — or if a real provider raises — the service returns deterministic synthetic fields with pre-recorded source boxes. `textract` is **not** wired tonight and falls back to fixture; `tesseract` works for images (PDF rasterization not wired → fixture fallback).
- **Safety events (for Member 4 audit/output guard):** `service.safety_events()` returns a content-free list of `{"documentId", "type"}` (`prompt_injection`, `suspicious_field_value`) — no document text is ever stored. `service.injection_detected(doc_id)` is a convenience check. Not part of the frozen extraction contract; consume server-side only.
- **Known limitations:**
  - Real-OCR field mapping (`mapper.py`) is conservative and intended for images; the fixture remains the reliable demo path.
  - PATCH uses an in-memory doc store (dev fallback). Real session-scoped persistence is Member 4's `store/` adapter.
  - `derivedStale` is an extra key on the PATCH response only (not on the frozen extraction contract) to signal downstream recompute; drop or relocate if the team prefers.

## Helpers for Member 4 integration
- **Normalized values (for Members 3 & 4):** date fields are returned as ISO 8601 (`YYYY-MM-DD`) and `pay_frequency` as a canonical token (`weekly` | `biweekly` | `semimonthly` | `monthly` | `annually`). Unparseable values are kept as-is for the renter to correct. Amounts are numbers (currency symbols/commas stripped).
- **Feature registry:** `from backend.extraction.features import feature_registry` → list of `{documentType, field, purpose, retention}` for every allowlisted field. Merge into the canonical `GET /features`. Content-free (no values/PII).
- **Confirmed profile:** `service.confirmed_fields(doc_id)` → only `confirmed`/`corrected` fields, for `GET /profile` ("confirmed profile only").
- **Staleness:** `service.is_stale(doc_id)` → True after a confirm/correct so Member 3's calculations recompute.
- **Safety events:** `service.safety_events()` / `service.injection_detected(doc_id)` → content-free audit signals.

## Exact steps Member 4 must perform to integrate
1. **Mount the router** in `backend/main.py` (do not edit anything else in this module):
   ```python
   from backend.extraction.api import router as extraction_router
   app.include_router(extraction_router)
   ```
   ✅ **Already done** — `main.py` mounts it via `_try_include("backend.extraction.api")`. Verified: `POST /documents` returns 201 in the assembled app.
2. **Dependencies:** ✅ `backend/requirements.txt` already covers the core needs (`fastapi`, `python-multipart`, `pydantic`, `pytest`, `httpx`). **For the OpenAI vision + PDF path, fold `openai>=1.40` and `pymupdf>=1.24` into `backend/requirements.txt`** so CI/Render install them (they're in `backend/extraction/requirements.txt`). Optional Tesseract deps (`pytesseract`, `Pillow`) are only for the local OCR path. All extra-provider tests skip cleanly when deps/keys are absent.
   - **Env vars to add** to `.env.example` + Render: `VISION_PROVIDER=openai`, `OPENAI_API_KEY` (**secret — Render dashboard only, never commit**), `OPENAI_VISION_MODEL=gpt-4o-mini`, `OPENAI_MAX_CALLS=50`, `OPENAI_TIMEOUT_SECONDS=30`.
3. **CORS:** set real `CORS_ORIGINS`; the permissive CORS in `dev_app.py` is local-only and is **not** used in `main.py`.
4. **PATCH → profile:** ✅ **Already wired.** `PATCH /documents/{doc_id}/fields` calls `profile_store.upsert_field(...)` when the document was uploaded with a `session_id`. Verified end-to-end: PATCH then `GET /profile?session_id=…` returns the corrected value. You can now remove the demo fallback in `profile/router.py`. (The `ExtractionService` doc store is still in-memory; swap it for the `store/` adapter if you want session-scoped persistence of unconfirmed docs too.)

## Rollback note
Module is additive and self-contained under `backend/extraction/`. To roll back, revert the squash-merge commit or simply do not `include_router(extraction_router)` in `main.py` — no other module imports it.
