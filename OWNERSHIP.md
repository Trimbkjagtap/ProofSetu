# File Ownership & Branch Model

To prevent merge conflicts, each path has ONE owner. Do not edit files outside
your ownership without posting in team chat first.

## Branches
| Branch | Owner / use | Rules |
|---|---|---|
| `main` | Protected archival branch | **No commits, pushes, PRs, merges, or force pushes during the hackathon.** |
| `develop` | Integration + deployment + submission | Only PR merges. Member 4 is integration owner. CI must pass. Deploy from here. |
| `feat/frontend-a11y` | Member 1 | Owns `frontend/` except shared contracts. |
| `feat/extraction` | Member 2 | Owns `backend/extraction/` + extraction tests. |
| `feat/rules-calculation` | Member 3 | Owns `backend/rules/`, `data/reference/` rule assets, calc tests. |
| `feat/checklist-packet-safety` | Member 4 | Owns checklist, packet, guards, store, shared routing, CI, deploy, docs. |

## Path ownership
| Path | Owner | Others |
|---|---|---|
| `frontend/**` | Member 1 | Read; request changes through Member 1. |
| `backend/extraction/**` | Member 2 | Do not edit. |
| `backend/rules/**` | Member 3 | Do not edit. |
| `backend/checklist/**`, `packet/**`, `guards/**`, `store/**` | Member 4 | Do not edit. |
| `backend/main.py`, root configs, CI, `.env.example`, `README` | Member 4 | Submit a request/snippet; Member 4 applies. |
| `contracts/**` | Member 4 (after team agreement) | Treat as read-only. |
| `data/reference/` rules + MTSP | Member 3 | Member 4 may package/deploy, not rewrite. |
| `data/synthetic/` demo files | Member 2 + Member 4 review | Synthetic only; no real PII. |

## Core API endpoints
| Method | Path | Purpose | Owner |
|---|---|---|---|
| POST | `/session` | Create anonymous consented session with TTL | Member 4 |
| DELETE | `/session/{id}` | Delete all session-scoped data + temp files | Member 4 |
| POST | `/documents` | Upload, classify, extract allowlisted fields | Member 2 |
| PATCH | `/documents/{doc_id}/fields` | Confirm/correct a field; mark derived results stale | Member 2 + 4 |
| GET | `/profile` | Return confirmed profile only | Member 4 |
| POST | `/rules/query` | Grounded explanation, citation + deterministic facts, or abstain | Member 3 |
| GET | `/checklist?program=lihtc` | Authored checklist with deterministic statuses | Member 4 |
| POST | `/packet` | Assemble preview from confirmed fields + selected docs | Member 4 |
| GET | `/packet/{id}/pdf` | Download renter-initiated PDF | Member 4 |
| GET | `/features` | Publish extracted fields, purpose, retention | Member 4 |

## Merge order at each checkpoint (Member 4 enforces)
1. contracts / shared scaffold (already in `develop`)
2. Member 2 — extraction
3. Member 3 — rules / calculation
4. Member 4 — backend integration
5. Member 1 — frontend **last**, so the UI consumes final endpoint shapes

## Conflict prevention
- Only Member 4 edits `backend/main.py`, root lock/config files, contracts, CI, README.
- Keep frontend and backend dependency files separate.
- No repo-wide refactors. No renaming directories or endpoints after 5:05 PM.
- No force pushes. Merge `develop` into feature branches, never rewrite shared history.
- **All PRs target `develop`. Never `main`.**
