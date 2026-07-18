# backend/ — FastAPI service

Deployed to Render from `develop`. Each subfolder has ONE owner.

## Structure & ownership
| Path | Owner | Purpose |
|---|---|---|
| `main.py` | Member 4 | FastAPI app, routing, CORS. **Integration owner only.** |
| `extraction/` | Member 2 | Upload validation, OCR, router, allowlists, confidence, source boxes. |
| `rules/` | Member 3 | Frozen-corpus retrieval, citations, deterministic calculations, abstention. |
| `checklist/` | Member 4 | Gold-checklist engine (present/missing/expiring/expired). |
| `packet/` | Member 4 | Packet assembly + PDF export from confirmed fields only. |
| `guards/` | Member 4 | Input guard (injection) + output guard (verdict language) + refusal. |
| `store/` | Member 4 | Session/TTL storage adapter (Upstash Redis + in-memory fallback). |
| `models/` | Shared | Pydantic models matching `contracts/*.json` exactly. |

## Rules
- Members 2 & 3 provide **router registration instructions** to Member 4; they do
  not edit `main.py` directly.
- Every response shape must match `contracts/*.json` property names exactly.
- Keep a fixture/memory fallback for every external dependency.
