import { ACCEPTED_MIME, DOCUMENT_LIMITS, MAX_MB } from "./config";

const ACCEPTED_EXT = /\.(pdf|docx?|jpe?g|png)$/i;

/** A stable signature for duplicate detection (name + size). */
export function fileSignature(name: string, size: number): string {
  return `${name.toLowerCase()}::${size}`;
}

/**
 * Validates a file in simple language. Returns an error string, or null if OK.
 * Checks: session limit, type (extension + MIME when present), empty, size, and
 * duplicates. `currentCount` is the number of documents already in the session.
 */
export function validateFile(
  file: File,
  existingSignatures: ReadonlySet<string>,
  currentCount: number
): string | null {
  if (currentCount >= DOCUMENT_LIMITS.maxDocuments) {
    return `You can add up to ${DOCUMENT_LIMITS.maxDocuments} documents in this session.`;
  }
  const extOk = ACCEPTED_EXT.test(file.name);
  // Only reject on MIME when the browser provided one and it's clearly wrong.
  const mimeOk = !file.type || ACCEPTED_MIME.includes(file.type);
  if (!extOk || !mimeOk) {
    return "This file type isn’t supported. Add a PDF, Word document, JPG or PNG.";
  }
  if (file.size === 0) {
    return "That file looks empty. Please choose a different file.";
  }
  if (file.size > DOCUMENT_LIMITS.maxBytes) {
    return `This file is too large. Choose a file smaller than ${MAX_MB} MB.`;
  }
  if (existingSignatures.has(fileSignature(file.name, file.size))) {
    return "This document has already been added.";
  }
  return null;
}
