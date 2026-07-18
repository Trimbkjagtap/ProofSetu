# Risk & Responsible-AI Note (draft)

## Responsible-AI boundary
RealDoor stops at **readiness**. It never approves, denies, scores, ranks,
recommends, predicts, or determines eligibility. AI is limited to reading documents
and phrasing grounded explanations from a frozen corpus. All decisions requiring
judgment are made by a qualified human outside the renter flow.

## Safety controls (live-tested)
| Control | Behavior |
|---|---|
| Eligibility refusal | Show rule + confirmed value + formula + citation; state a human decides. |
| Output guard | Block verdict/score/rank/recommendation language; replace with safe factual pattern. |
| Input guard | Treat all document text as untrusted data; ignore embedded instructions. |
| Delete | Flush session state, temp files, extracted fields, packet; keep event-only audit if needed. |
| No hidden proxies | `/features` publishes every extracted field, purpose, and retention. |
| No auto-send | Packet is renter-downloaded or renter-shared only; no background submission. |

## Data handling
- Synthetic documents only; never real PII.
- Never store a full SSN or full government ID number (last 4 only).
- Never log raw OCR text, uploaded bytes, or secrets.
- Anonymous sessions with a short TTL; deletion is renter-initiated.

## Known limitations
- Single frozen demo case (one metro, LIHTC, 2026 rules).
- Free-tier infra (Render spins down on idle; ephemeral filesystem).
- Fixture/mock fallback used when external OCR/vision/index services are unavailable.

## Rollback
Keep a known-stable `develop` commit/tag after each checkpoint. If a merge breaks
`develop`, revert the squash commit (never patch `main`). Frontend can fall back to
`NEXT_PUBLIC_USE_MOCKS=true`.
