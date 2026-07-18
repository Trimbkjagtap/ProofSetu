# RealDoor — Application-Readiness Copilot

> Hack-Nation 6.0 · Challenge 3 · Repo: `ProofSetu`

## Problem & one-line solution
Applying for affordable housing means assembling confusing paperwork under rules
most renters can't easily read. **RealDoor is a renter-controlled copilot that turns
synthetic household documents into a human-confirmed profile, explains published
rules with citations, does deterministic math, flags missing/expired documents, and
produces a renter-controlled packet — without ever deciding eligibility.**

## Responsible-AI boundary (non-negotiable)
RealDoor **never** approves, denies, scores, ranks, recommends, predicts, or
determines eligibility. The AI only reads documents and phrases grounded
explanations. All math, checklist status, guards, and packet logic are
deterministic code. **A qualified human makes the final decision, outside the
renter flow.**

## Frozen five-step renter journey
1. **Consent** — plain-language data use; anonymous TTL session; delete control.
2. **Profile** — household size + synthetic document upload; OCR + allowlisted
   extraction with confidence and source boxes; confirm/correct fields.
3. **Fit Check** — ask a program-rule question; grounded citation + effective date
   + deterministic math; no verdict.
4. **Readiness** — gold-checklist engine returns present / missing / expiring /
   expired + fix guidance.
5. **Packet** — preview, edit, download PDF, optional expiring link, or delete.
   Confirmed fields only; never auto-sends.

## Scope (frozen)
- One metro, one program (**LIHTC**), one rule year (**2026**).
- Four document types: pay stub, benefit letter, bank statement, government ID.
- Synthetic documents only — never real PII.

## Tech stack & external services
- **Frontend:** Next.js / React / TypeScript / Tailwind → Vercel (deploy `develop`)
- **Backend:** FastAPI (Python) → Render (deploy `develop`)
- **Session:** Upstash Redis (free) with in-memory fallback
- **OCR:** AWS Textract free tier if ready; else Tesseract + fixture
- **Vision/text:** sponsor OpenAI credits if confirmed; else Gemini free-tier; else fixture
- **Rules index:** Chroma OSS or FAISS (one only); keyword fallback for tiny corpus
- **PDF:** WeasyPrint local; browser print fallback
- **CI:** GitHub Actions

## Repository / branch model
See [OWNERSHIP.md](OWNERSHIP.md). `main` is protected and untouched; all work
happens on feature branches and merges via PR into `develop`; the submission is
deployed from `develop`.

## Contracts
See [contracts/](contracts/). Frozen JSON shapes; the frontend builds against them
as fixtures before live backends exist.

## Local setup
_Per-area setup lives in each member's handoff under [docs/handoffs/](docs/handoffs/)._
Copy `.env.example` → `.env` and fill values locally (never commit `.env`).

## Deployment URLs
- Frontend (Vercel): _TBD_
- Backend health (Render): _TBD_ (`/health`)

## Known limitations & roadmap
Prototype built for a single frozen demo case. No multi-program/metro, no property
discovery, no caseworker portal, no auto-submission. See [RISK_NOTE.md](RISK_NOTE.md).

## Sources & licenses
- HUD MTSP 2026 / frozen organizer LIHTC corpus (source of truth; no live rule search).
- See per-service links and synthetic-data manifest before submission.
