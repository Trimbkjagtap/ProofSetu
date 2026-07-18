# Member 2 Handoff — Document Extraction & Source Evidence

- **Branch / latest commit:** `feat/extraction`
- **Files changed:** `backend/extraction/**` (new module), `docs/handoffs/member-2.md`
- **Endpoint(s) delivered:**
  - `POST /documents` — upload → validate → classify → extract allowlisted fields + confidence + source boxes.
  - `PATCH /documents/{doc_id}/fields` — confirm/correct a field; returns updated doc + `derivedStale` flag (Member 2 + 4 integration).
  - `GET /extraction/health` — module liveness.
- **Document types supported:** all four — `pay_stub`, `government_id` (expired-ID demo), `benefit_letter`, `bank_statement`. Each has a deterministic fixture and a line-aware real-OCR mapping path.
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
  → **36 passed, 5 skipped** (skips are real-Tesseract tests that auto-run once the engine binary is installed). Covers MIME accept/reject, low-confidence→please_check, injection ignored, ID last-4 only, source box present, contract keys, no forbidden tokens, POST/PATCH endpoints, line-aware mapping for all four document types, and end-to-end prompt-injection hardening.
- **Fixture/fallback behavior:** Fixture-first. With `OCR_PROVIDER=fixture` (default) — or if a real provider raises — the service returns deterministic synthetic fields with pre-recorded source boxes. `textract` is **not** wired tonight and falls back to fixture; `tesseract` works for images (PDF rasterization not wired → fixture fallback).
- **Safety events (for Member 4 audit/output guard):** `service.safety_events()` returns a content-free list of `{"documentId", "type"}` (`prompt_injection`, `suspicious_field_value`) — no document text is ever stored. `service.injection_detected(doc_id)` is a convenience check. Not part of the frozen extraction contract; consume server-side only.
- **Known limitations:**
  - Real-OCR field mapping (`mapper.py`) is conservative and intended for images; the fixture remains the reliable demo path.
  - PATCH uses an in-memory doc store (dev fallback). Real session-scoped persistence is Member 4's `store/` adapter.
  - `derivedStale` is an extra key on the PATCH response only (not on the frozen extraction contract) to signal downstream recompute; drop or relocate if the team prefers.

## Exact steps Member 4 must perform to integrate
1. **Mount the router** in `backend/main.py` (do not edit anything else in this module):
   ```python
   from backend.extraction.api import router as extraction_router
   app.include_router(extraction_router)
   ```
2. **Dependencies:** fold `backend/extraction/requirements.txt` into `backend/requirements.txt` (or add `-r extraction/requirements.txt`) so CI installs `fastapi`, `python-multipart`, `pydantic`, `pytest`, `httpx`. CI already runs `pytest -q` from repo root and will pick up `backend/extraction/tests`.
3. **CORS:** set real `CORS_ORIGINS`; the permissive CORS in `dev_app.py` is local-only and is **not** used in `main.py`.
4. **Wire PATCH to the session store** when ready: replace the in-memory `ExtractionService` doc store with the `store/` adapter, keeping the same method signatures.

## Rollback note
Module is additive and self-contained under `backend/extraction/`. To roll back, revert the squash-merge commit or simply do not `include_router(extraction_router)` in `main.py` — no other module imports it.
