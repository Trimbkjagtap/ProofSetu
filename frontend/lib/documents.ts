import type { DocumentType } from "@/types/domain";

/** Human-readable labels for the four supported document types. */
export const DOCUMENT_LABELS: Record<DocumentType, string> = {
  pay_stub: "Pay stub",
  benefit_letter: "Benefit letter",
  bank_statement: "Bank statement",
  government_id: "Photo identification",
};

export function humanizeDocumentType(type: DocumentType): string {
  return DOCUMENT_LABELS[type] ?? type.replace(/_/g, " ");
}
