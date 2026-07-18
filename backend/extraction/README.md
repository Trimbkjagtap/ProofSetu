# backend/extraction/ — Document Extraction & Source Evidence (Member 2)

Owns: upload validation, input guard, OCR, document routing, allowlist mapping,
confidence, and source boxes. Produces the `POST /documents` response exactly per
`contracts/extraction-response.json`.

## Pipeline
```
upload -> file validation -> input guard -> OCR words/coordinates
      -> document classifier -> type allowlist -> field mapper
      -> confidence + source box -> unconfirmed response
      -> renter correction/confirmation -> confirmed profile
```

## Fixture-first
The deterministic fixture (`fixtures.py`) is the required P0 fallback. With
`OCR_PROVIDER=fixture` (default) — or if a real provider errors — the service
returns known synthetic fields with pre-recorded source boxes. This keeps the
demo stable and unblocks the frontend before live OCR exists.

## Environment variables
| Variable | Values | Default | Meaning |
|---|---|---|---|
| `OCR_PROVIDER` | `fixture` \| `tesseract` \| `textract` | `fixture` | `textract` is not wired tonight and falls back to fixture. |
| `MAX_UPLOAD_MB` | number | `10` | Upload size cap. |
| `TESSERACT_CMD` | path | (unset) | Full path to `tesseract.exe` when the engine is not on PATH. |

## Real OCR (optional, no API key)
The `tesseract` provider needs the Tesseract **engine binary** (free, local):
```bash
# Windows (run in an ADMIN terminal):
choco install tesseract -y
# then, from repo root:
OCR_PROVIDER=tesseract uvicorn backend.extraction.dev_app:app --port 8001
```
If the binary is not on PATH, set `TESSERACT_CMD` to e.g.
`C:\Program Files\Tesseract-OCR\tesseract.exe`. Without the binary the pipeline
falls back to the deterministic fixture automatically.

## Run locally (from repo root)
```bash
pip install -r backend/extraction/requirements.txt
uvicorn backend.extraction.dev_app:app --reload --port 8001
```

## Test (from repo root)
```bash
pytest -q backend/extraction/tests
```

## Safety
- Document text is untrusted **data**, never instructions (`input_guard.py`).
- Only allowlisted fields leave the pipeline (`allowlists.py`).
- Government IDs expose `id_number_last4` only (`pii.py`). Never log raw OCR text,
  full PII, or uploaded bytes.
- Structured errors on bad input; never partial/invented values.

## Integration
Member 4 mounts the router — no edits to `backend/main.py` from here:
```python
from backend.extraction.api import router as extraction_router
app.include_router(extraction_router)
```
