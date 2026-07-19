/**
 * ProofSetu domain types.
 *
 * These mirror the FROZEN shapes in `../../contracts/*.json` and use the frozen
 * status vocabulary. Property names must not diverge from the contracts.
 *
 * Safety boundary: no type in this file expresses an eligibility verdict.
 * ProofSetu prepares; the renter confirms; a qualified housing professional decides.
 */

/* ------------------------------------------------------------------ */
/* Documents & extraction                                             */
/* ------------------------------------------------------------------ */

export type DocumentType =
  | "pay_stub"
  | "benefit_letter"
  | "bank_statement"
  | "government_id"
  | "other";

/** What the user asked us to treat the document as ("auto" = let us identify). */
export type RequestedType = DocumentType | "auto";

/** How a document entered the app. */
export type DocumentSource = "upload" | "scan";

/** Front-end review status for the document list (derived, not a contract field). */
export type ReviewStatus =
  | "waiting"
  | "reading"
  | "ready"
  | "needs_attention"
  | "failed";

/** Frozen document status vocabulary. */
export type DocumentStatus =
  | "uploading"
  | "processing"
  | "needs_confirmation"
  | "confirmed"
  | "needs_attention";

/** Frozen field status vocabulary. */
export type FieldState =
  | "unconfirmed"
  | "confirmed"
  | "corrected"
  | "please_check";

/** Pixel box (relative to the rendered document page) highlighting evidence. */
export interface SourceBox {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ExtractedField {
  name: string;
  /** Extracted values may be strings (names, text) or numbers (amounts). */
  value: string | number;
  /** 0..1 model confidence for the extracted value. */
  confidence: number;
  state: FieldState;
  sourceBox?: SourceBox | null;
  /** Optional evidence snippet the backend read the value from. */
  evidenceText?: string;
  /** True when the renter added this field by hand (extraction missed it). */
  manual?: boolean;
}

export interface ExtractionResponse {
  documentId: string;
  documentType: DocumentType;
  status: DocumentStatus;
  fields: ExtractedField[];
  /** Optional non-fatal warnings from extraction. */
  warnings?: string[];
  /** Optional error message when extraction failed. */
  error?: string;
}

/**
 * A document in front-end state: the extraction response plus safe metadata.
 * Raw images are never stored here — only the file name/size and confirmed data.
 */
export interface DocumentRecord extends ExtractionResponse {
  /** Backend document ID when live extraction returns one. */
  backendDocumentId?: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  source: DocumentSource;
  requestedType: RequestedType;
}

/* ------------------------------------------------------------------ */
/* Rules query & deterministic calculation                            */
/* ------------------------------------------------------------------ */

export interface RuleCalculation {
  confirmedValue: number;
  formula: string;
  annualizedIncome: number;
  threshold: number;
  difference: number;
}

export interface RuleCitation {
  source: string;
  effectiveDate: string; // ISO date
  ruleYear: number;
  section: string;
}

export interface RulesResponse {
  answer: string;
  calculation: RuleCalculation | null;
  citation: RuleCitation | null;
  /** True when the assistant safely declines (e.g. an eligibility question). */
  abstained: boolean;
  disclaimer: string;
}

/* ------------------------------------------------------------------ */
/* Readiness checklist                                                */
/* ------------------------------------------------------------------ */

/** Frozen checklist status vocabulary. Never an eligibility score. */
export type ChecklistStatus = "present" | "missing" | "expiring" | "expired";

export interface ChecklistItem {
  documentType: DocumentType;
  label: string;
  required: boolean;
  status: ChecklistStatus;
  fixHint: string;
}

export interface ChecklistResponse {
  items: ChecklistItem[];
}

/* ------------------------------------------------------------------ */
/* Packet                                                             */
/* ------------------------------------------------------------------ */

/** Frozen packet status vocabulary. */
export type PacketStatus =
  | "draft"
  | "ready_for_preview"
  | "downloaded"
  | "deleted";

export interface PacketResponse {
  sessionId: string;
  fields: ProfileField[];
  includedDocuments: string[];
  packetId?: string;
  status?: PacketStatus;
  confirmedFieldsOnly?: boolean;
  downloadUrl?: string;
}

/* ------------------------------------------------------------------ */
/* Session & profile                                                  */
/* ------------------------------------------------------------------ */

export interface SessionResponse {
  sessionId: string;
  expiresAt: number | string;
  ttlSeconds: number;
}

export interface ProfileResponse {
  sessionId: string;
  confirmedFieldsOnly: boolean;
  /** Confirmed fields only — nothing unconfirmed reaches the profile. */
  fields: ProfileField[];
}

export interface ProfileField {
  name: string;
  value: string | number;
  state: FieldState;
}

export interface ConfirmedProfileField {
  documentId: string;
  name: string;
  value: string | number;
  state: FieldState;
}

/* ------------------------------------------------------------------ */
/* Field update payload                                               */
/* ------------------------------------------------------------------ */

export interface FieldUpdate {
  name: string;
  value: string | number;
  state: FieldState;
}
