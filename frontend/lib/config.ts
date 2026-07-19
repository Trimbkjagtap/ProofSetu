/**
 * Single source of truth for document limits and accepted file kinds.
 * If a backend later advertises its own limits, override these values here.
 */
export const DOCUMENT_LIMITS = {
  /** Maximum documents per session. */
  maxDocuments: 10,
  /** Maximum size per document, in bytes (15 MB). */
  maxBytes: 15 * 1024 * 1024,
} as const;

export const MAX_MB = Math.round(DOCUMENT_LIMITS.maxBytes / (1024 * 1024));

export const ACCEPTED_EXTENSIONS = ["pdf", "doc", "docx", "jpg", "jpeg", "png"];

export const ACCEPTED_MIME = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
];

/** The value for a file input's `accept` attribute. */
export const ACCEPT_ATTR =
  ".pdf,.doc,.docx,.jpg,.jpeg,.png,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png";
