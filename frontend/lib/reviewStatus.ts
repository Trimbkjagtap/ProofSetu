import type { DocumentRecord, ReviewStatus } from "@/types/domain";

/** Count fields the renter has confirmed or corrected. */
export function confirmedCount(doc: DocumentRecord): number {
  return doc.fields.filter(
    (f) => f.state === "confirmed" || f.state === "corrected"
  ).length;
}

/** True when every extracted field on a document is confirmed/corrected. */
export function isDocumentSettled(doc: DocumentRecord): boolean {
  return doc.fields.length > 0 && confirmedCount(doc) === doc.fields.length;
}

/** Derive the review-list status for a document. */
export function reviewStatusFor(doc: DocumentRecord): ReviewStatus {
  if (doc.error) return "failed";
  if (doc.status === "uploading" || doc.status === "processing") return "reading";
  if (doc.fields.length === 0) return "needs_attention";
  if (isDocumentSettled(doc)) return "ready";
  return "ready";
}

export const REVIEW_META: Record<
  ReviewStatus,
  { label: string; emoji: string; className: string }
> = {
  waiting: { label: "Waiting", emoji: "⏳", className: "bg-blush text-muted border-line" },
  reading: { label: "Reading", emoji: "🔍", className: "bg-blush text-clay border-clay/40" },
  ready: {
    label: "Ready to review",
    emoji: "✅",
    className: "bg-[#E4F1ED] text-[#215E52] border-success/40",
  },
  needs_attention: {
    label: "Needs attention",
    emoji: "⚠️",
    className: "bg-[#FBE8CE] text-[#9A5B00] border-warning/50",
  },
  failed: {
    label: "Failed",
    emoji: "❌",
    className: "bg-[#F8E4E3] text-danger border-danger/50",
  },
};
