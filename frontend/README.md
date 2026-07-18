# frontend/ — Owner: Member 1 (`feat/frontend-a11y`)

Next.js / React / TypeScript / Tailwind renter journey. **Member 1 installs the
frontend toolchain here** (`create-next-app` or equivalent). Other members: read
only; request changes through Member 1.

## Structure
- `app/` — five routes: `/consent`, `/profile`, `/fit-check`, `/readiness`, `/packet`
- `components/` — ProgressStepper, DocumentUploadCard, SourceBoxOverlay, FieldCard,
  ConfidenceLabel, CitationCard, CalculationCard, ChecklistItem, PacketPreview,
  DeleteSessionDialog, LiveStatusAnnouncement, ErrorSummary, etc.
- `lib/api/` — central `apiClient` with a **mock/live switch**
  (`NEXT_PUBLIC_USE_MOCKS`); no direct `fetch` inside components.
- `lib/a11y/` — accessibility helpers (focus management, live announcements).
- `mocks/` — fixtures mirroring every file in `../contracts/`.

Build the entire clickable demo path against mocks **before** live APIs exist.
