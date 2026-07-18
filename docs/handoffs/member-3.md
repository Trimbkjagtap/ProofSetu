# Member 3 Handoff — Rules Retrieval & Deterministic Calculations

- **Branch / latest commit:** `feat/rules-calculation`
- **Owner:** Member 3
- **Endpoint delivered:** `POST /rules/query` → exact `contracts/rules-response.json` shape
- **Contract version consumed:** `contracts/rules-response.json` (frozen; property names unchanged)

## Files changed
| Path | Purpose |
|---|---|
| `backend/rules/calculations.py` | Pure deterministic functions: `annualize_income`, `count_household_income`, `lookup_mtsp_limit`, `compare_facts`, `format_formula`. No model, no I/O beyond the frozen MTSP table. |
| `backend/rules/retrieval.py` | Deterministic keyword retrieval over the frozen corpus + `citation_for`. Abstains when overlap score < 2. |
| `backend/rules/service.py` | `answer_rule_query(...)` assembles the contract response; `assert_no_verdict` output guard; `abstain(...)`. |
| `backend/rules/router.py` | FastAPI `APIRouter` (thin adapter → service). |
| `backend/rules/fixtures/rules-response.example.json` | Gold fixture matching the contract, for frontend fallback. |
| `backend/rules/requirements.txt` | fastapi, pydantic (router only), pytest (dev). |
| `data/reference/mtsp_2026.json` | Frozen 2026 MTSP thresholds (Cambridge/Boston, 50% & 60% AMI, HH 1–6). **DEMO FIXTURE.** |
| `data/reference/lihtc_corpus_2026.json` | Frozen 2026 LIHTC rule chunks (annualization, required docs, recency, comparison). **DEMO FIXTURE.** |
| `tests/test_rules.py` | 22 gold/unit tests. |

## Run command
```bash
# Core logic uses ONLY the Python stdlib — no install needed to run tests.
python3 -m unittest tests.test_rules -v
# or, with pytest:
pip install -r backend/rules/requirements.txt
pytest -q tests/test_rules.py
```
**Test result:** 22 passed.

## Environment variable names (no values)
- `RULE_INDEX` — `keyword` (default, implemented) | `chroma` | `faiss` (future adapters; same return shape).

## Exact steps Member 4 must perform to integrate
1. `backend/__init__.py` is now included (empty package marker) so `backend.rules.*`
   imports resolve. Left empty on purpose — app wiring stays yours in `backend/main.py`.
2. In `backend/main.py`:
   ```python
   from backend.rules.router import router as rules_router
   app.include_router(rules_router)
   ```
   This exposes `POST /rules/query`. No other wiring needed.
3. Add `backend/rules/requirements.txt` deps to the backend environment (fastapi, pydantic already present for the app).
4. `data/reference/*.json` must ship with the deploy (read at runtime, relative to repo root).

### Request shape (`POST /rules/query`)
```json
{
  "question": "How is my monthly income annualized?",
  "confirmedIncome": { "amount": 2650, "frequency": "monthly" },
  "metro": "cambridge_boston",
  "householdSize": 1,
  "amiPct": 50,
  "year": 2026
}
```
Response = exact `contracts/rules-response.json` shape (`calculation` and `citation` are `null` when `abstained` is true).

## Correction propagation (handbook 9.4)
When the renter corrects gross pay, the frontend re-calls `POST /rules/query` with the new `confirmedIncome.amount`. The service recomputes `annualizedIncome`, `threshold`, and `difference` deterministically. There is no cached state on the rules side — every call is pure, so correction → recompute is automatic.

## Fixture / fallback behavior
- **No live search.** Retrieval reads only `data/reference/lihtc_corpus_2026.json`.
- `RULE_INDEX=keyword` needs no vector DB. If a future `chroma`/`faiss` index fails, fall back to keyword (already the default).
- If MTSP lookup or retrieval can't ground/find an input → response has `abstained: true`, `calculation: null`, `citation: null` (never a guessed threshold).

## Safety guarantees
- Every grounded answer carries `source`, `section`, `effectiveDate`, `ruleYear`.
- `assert_no_verdict` blocks `eligible/approved/denied/qualified/pass/fail/rank/...`; it allows the mandated phrase "a qualified human decides".
- Functions return **facts only** (`counted`, `threshold`, `difference`) — never a verdict.

## Known limitations
- Reference data is a **clearly-labeled DEMO fixture** (`_meta.notice`), not a live HUD pull. Swap in the organizer's frozen file if provided; keep the same JSON shape.
- One metro (`cambridge_boston`), AMI 50%/60%, household sizes 1–6.
- Keyword retrieval is tuned for the narrow demo question set (annualization, required docs, recency, comparison).

## Rollback note
Pure module with no shared-file edits. Revert the squash commit of this PR on `develop`; nothing else depends on it until Member 4 mounts the router.
