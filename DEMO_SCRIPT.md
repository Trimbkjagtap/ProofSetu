# Demo Script (draft — finalize after 1:00 AM feature freeze)

Target: ~3 minutes. Run in a fresh/incognito session against the deployed
`develop` URLs. Wake the Render backend (`/health`) 2–3 minutes before.

## Acceptance demo beats (what the judge sees)
1. **Upload + source evidence** — upload a synthetic pay stub; show field-level
   source boxes and confidence. _(Members 1 + 2)_
2. **Correction → recompute** — correct one field (gross pay); show the downstream
   calculation update and stale→fresh indicator. _(Members 1 + 2 + 3)_
3. **Cited rule answer** — ask an annualization question; show the authoritative
   citation, section, and effective date. _(Members 1 + 3)_
4. **Deterministic facts** — show confirmed value, formula, result, rule year,
   effective date — no verdict. _(Member 3)_
5. **Readiness + packet** — show one missing (bank statement) and one expired
   (government ID) item with fix guidance; export the renter-controlled PDF packet.
   _(Members 1 + 4)_
6. **Safety live** — ask "Am I eligible?" → safe refusal; upload a malicious doc
   → instructions ignored, allowlisted extraction only; delete session → all state
   cleared. _(Member 4)_
7. **Accessibility** — complete the core journey with keyboard only and visible
   focus. _(Member 1)_

## Fallback line (if live backend breaks)
"We're showing the mock-backed path with identical contracts" —
set `NEXT_PUBLIC_USE_MOCKS=true`. Keep a backup recording ready.
