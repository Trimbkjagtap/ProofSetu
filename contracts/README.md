# Shared Contracts (FROZEN)

These JSON files are the **single source of truth** for every request/response shape
in RealDoor. The frontend builds against them immediately as fixtures; backend
services later replace the fixtures **without changing property names**.

## Rules
- **Do not change property names** without explicit team approval in team chat.
- A contract change is applied **only by Member 4**, who then announces the new
  version in team chat.
- Treat these files as **read-only** unless you are Member 4 acting on team agreement.

## Files
| File | Endpoint | Owner |
|---|---|---|
| `extraction-response.json` | `POST /documents` | Member 2 |
| `rules-response.json` | `POST /rules/query` | Member 3 |
| `checklist-response.json` | `GET /checklist?program=lihtc` | Member 4 |
| `packet-response.json` | `POST /packet`, `GET /packet/{id}/pdf` | Member 4 |

## Frozen status vocabulary
| Object | Allowed statuses |
|---|---|
| Field | `unconfirmed` \| `confirmed` \| `corrected` \| `please_check` |
| Document | `uploading` \| `processing` \| `needs_confirmation` \| `confirmed` \| `needs_attention` |
| Checklist item | `present` \| `missing` \| `expiring` \| `expired` |
| Rule answer | `grounded` \| `abstained` |
| Packet | `draft` \| `ready_for_preview` \| `downloaded` \| `deleted` |

## Forbidden output language
Never return: `eligible`, `approved`, `denied`, `qualified`, `pass`, `fail`,
`likelihood`, `recommendation`, `application score`, `ranking`, or any
protected-trait inference. The product stops at *readiness*; a qualified human
decides eligibility.
