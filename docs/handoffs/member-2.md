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
- **Environment variable names (no values):** `OCR_PROVIDER` (`fixture`|`tesseract`|`textract`), `MAX_UPLOAD_MB`.
- **Run command (from repo root):**
  ```bash
  pip install -r backend/extraction/requirements.txt
  uvicorn backend.extraction.dev_app:app --reload --port 8001
  ```
- **Test command and result:**
  ```bash
  pytest -q backend/extraction/tests
  ```
  → **71 passed, 5 skipped** (skips are real-Tesseract tests that auto-run once the engine binary is installed). Covers MIME accept/reject, magic-byte content sniffing (renamed-exe rejection), low-confidence→please_check, injection ignored, ID last-4 only, source box present, contract keys, no forbidden tokens, POST/PATCH endpoints, line-aware mapping for all four document types, and end-to-end prompt-injection hardening.
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
2. **Dependencies:** ✅ `backend/requirements.txt` already covers the core needs (`fastapi`, `python-multipart`, `pydantic`, `pytest`, `httpx`). Optional real-OCR deps (`pytesseract`, `Pillow`) are listed in `backend/extraction/requirements.txt`; add them only if you want the live Tesseract path (its tests skip cleanly otherwise).
3. **CORS:** set real `CORS_ORIGINS`; the permissive CORS in `dev_app.py` is local-only and is **not** used in `main.py`.
4. **PATCH → profile:** ✅ **Already wired.** `PATCH /documents/{doc_id}/fields` calls `profile_store.upsert_field(...)` when the document was uploaded with a `session_id`. Verified end-to-end: PATCH then `GET /profile?session_id=…` returns the corrected value. You can now remove the demo fallback in `profile/router.py`. (The `ExtractionService` doc store is still in-memory; swap it for the `store/` adapter if you want session-scoped persistence of unconfirmed docs too.)

## Rollback note
Module is additive and self-contained under `backend/extraction/`. To roll back, revert the squash-merge commit or simply do not `include_router(extraction_router)` in `main.py` — no other module imports it.
