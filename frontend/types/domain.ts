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
  | "government_id";

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
  sourceBox: SourceBox;
}

export interface ExtractionResponse {
  documentId: string;
  documentType: DocumentType;
  status: DocumentStatus;
  fields: ExtractedField[];
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
  calculation: RuleCalculation;
  citation: RuleCitation;
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
  packetId: string;
  status: PacketStatus;
  includedDocuments: DocumentType[];
  confirmedFieldsOnly: boolean;
  downloadUrl: string;
}

/* ------------------------------------------------------------------ */
/* Session & profile                                                  */
/* ------------------------------------------------------------------ */

export interface SessionResponse {
  sessionId: string;
  /** Unix ms expiry for the short-lived demo session. */
  expiresAt: number;
}

export interface ProfileResponse {
  householdSize: number;
  /** Confirmed fields only — nothing unconfirmed reaches the profile. */
  confirmedFields: ConfirmedProfileField[];
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
