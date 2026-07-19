import type {
  DocumentType,
  ExtractedField,
  ExtractionResponse,
  RequestedType,
  SourceBox,
} from "@/types/domain";

function field(
  name: string,
  value: string | number,
  confidence: number,
  sourceBox: SourceBox,
  evidenceText: string
): ExtractedField {
  return { name, value, confidence, state: "unconfirmed", sourceBox, evidenceText };
}

const box = (x: number, y: number, width: number, height: number): SourceBox => ({
  page: 1,
  x,
  y,
  width,
  height,
});

/** Sample fields per document type (synthetic data only). */
const SAMPLES: Record<DocumentType, ExtractedField[]> = {
  pay_stub: [
    field("employer_name", "Riverside Staffing Co.", 0.95, box(110, 60, 240, 40), "Riverside Staffing Co."),
    field("employee_name", "Maria Santos", 0.97, box(110, 145, 190, 34), "Employee: Maria Santos"),
    field("gross_pay", 2450, 0.82, box(410, 520, 150, 35), "Gross Pay $2,450.00"),
    field("pay_period", "May 1–31, 2026", 0.88, box(110, 560, 200, 30), "Pay Period 05/01–05/31/2026"),
    field("pay_frequency", "Monthly", 0.91, box(390, 560, 170, 32), "Pay Frequency: Monthly"),
  ],
  government_id: [
    field("document_type", "Driver’s License", 0.92, box(60, 60, 200, 30), "MASSACHUSETTS DRIVER LICENSE"),
    field("full_name", "Maria Santos", 0.96, box(60, 120, 220, 34), "SANTOS, MARIA"),
    field("issuing_state", "Massachusetts", 0.93, box(60, 210, 180, 30), "Massachusetts"),
    field("expiration_date", "2027-08-14", 0.9, box(320, 210, 160, 30), "EXP 08/14/2027"),
  ],
  bank_statement: [
    field("institution_name", "Bay State Credit Union", 0.94, box(90, 60, 260, 40), "Bay State Credit Union"),
    field("account_holder", "Maria Santos", 0.95, box(90, 150, 220, 34), "Account Holder: Maria Santos"),
    field("statement_period", "Apr 1 – Apr 30, 2026", 0.9, box(90, 200, 240, 30), "Statement Period 04/01–04/30/2026"),
  ],
  benefit_letter: [
    field("recipient_name", "Maria Santos", 0.95, box(90, 140, 220, 34), "Recipient: Maria Santos"),
    field("benefit_type", "SNAP", 0.9, box(90, 190, 180, 30), "Program: SNAP"),
    field("monthly_amount", 320, 0.88, box(360, 240, 150, 34), "Monthly Benefit $320.00"),
    field("effective_date", "2026-03-01", 0.9, box(90, 240, 180, 30), "Effective 03/01/2026"),
  ],
  other: [],
};

/** Resolve the requested type into a concrete detected type. */
function detectType(requested: RequestedType): DocumentType {
  // "auto" identifies as a pay stub for this demo corpus.
  return requested === "auto" ? "pay_stub" : requested;
}

/**
 * Builds a synthetic extraction response for the chosen document type. Different
 * types return different fields — no single hardcoded result. Synthetic only.
 */
export function mockExtractionFor(
  requested: RequestedType,
  documentId: string
): ExtractionResponse {
  const documentType = detectType(requested);
  const fields = SAMPLES[documentType].map((f) => ({ ...f }));

  if (documentType === "other" || fields.length === 0) {
    return {
      documentId,
      documentType,
      status: "needs_attention",
      fields: [],
      warnings: [
        "We couldn’t recognize this document automatically. You can add the details yourself.",
      ],
    };
  }

  return {
    documentId,
    documentType,
    status: "needs_confirmation",
    fields,
    warnings:
      requested === "auto"
        ? [`Identified as a ${documentType.replace(/_/g, " ")}.`]
        : undefined,
  };
}
