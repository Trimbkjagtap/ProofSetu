import type { DocumentType, RequestedType } from "@/types/domain";

/** Human-readable labels for the supported document types. */
export const DOCUMENT_LABELS: Record<DocumentType, string> = {
  pay_stub: "Pay stub",
  benefit_letter: "Benefit letter",
  bank_statement: "Bank statement",
  government_id: "Photo identification",
  other: "Other supporting document",
};

export function humanizeDocumentType(type: DocumentType): string {
  return DOCUMENT_LABELS[type] ?? type.replace(/_/g, " ");
}

/** Small contextual emoji per document type (decorative — always aria-hidden). */
export const DOCUMENT_TYPE_EMOJI: Record<DocumentType, string> = {
  pay_stub: "📄",
  government_id: "🪪",
  bank_statement: "🏦",
  benefit_letter: "✉️",
  other: "📎",
};

export function requestedTypeEmoji(type: RequestedType): string {
  return type === "auto" ? "✨" : DOCUMENT_TYPE_EMOJI[type];
}

/** File extension in lowercase (no dot), or "" if none. */
export function fileExtension(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot >= 0 ? fileName.slice(dot + 1).toLowerCase() : "";
}

/** Human file-format label (PDF, DOCX, JPG…). */
export function fileFormatLabel(fileName: string): string {
  const ext = fileExtension(fileName);
  if (ext === "jpeg") return "JPG";
  return ext ? ext.toUpperCase() : "FILE";
}

/** True for Word documents, which the browser can't preview accurately. */
export function isWordDocument(fileName: string): boolean {
  return /\.docx?$/i.test(fileName);
}


/** Options for the document-type selector, including "let us identify it". */
export const DOCUMENT_TYPE_OPTIONS: { value: RequestedType; label: string }[] = [
  { value: "auto", label: "Let ProofSetu identify it" },
  { value: "pay_stub", label: "Pay stub" },
  { value: "government_id", label: "Photo identification" },
  { value: "bank_statement", label: "Bank statement" },
  { value: "benefit_letter", label: "Benefit letter" },
  { value: "other", label: "Other supporting document" },
];

export function requestedTypeLabel(type: RequestedType): string {
  if (type === "auto") return "Let ProofSetu identify it";
  return humanizeDocumentType(type);
}
