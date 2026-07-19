"use client";

import { Eye, RefreshCw, Trash2, FileText, Camera } from "lucide-react";
import type { DocumentRecord } from "@/types/domain";
import {
  humanizeDocumentType,
  DOCUMENT_TYPE_EMOJI,
  fileFormatLabel,
} from "@/lib/documents";
import { confirmedCount, reviewStatusFor, REVIEW_META } from "@/lib/reviewStatus";

interface DocumentListProps {
  docs: DocumentRecord[];
  activeId: string | null;
  onReview: (id: string) => void;
  onReplace: (id: string) => void;
  onRemove: (id: string) => void;
}

/** The multi-document list with per-document status and actions. */
export function DocumentList({
  docs,
  activeId,
  onReview,
  onReplace,
  onRemove,
}: DocumentListProps) {
  return (
    <ul className="space-y-3">
      {docs.map((doc) => {
        const status = reviewStatusFor(doc);
        const meta = REVIEW_META[status];
        const isActive = doc.documentId === activeId;
        const done = confirmedCount(doc);
        return (
          <li
            key={doc.documentId}
            className={[
              "rounded-card border bg-paper p-4 shadow-card transition-shadow duration-200 hover:shadow-raised",
              isActive ? "border-clay ring-1 ring-clay/40" : "border-line",
            ].join(" ")}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {doc.source === "scan" ? (
                    <Camera className="h-4 w-4 shrink-0 text-clay" aria-hidden="true" />
                  ) : (
                    <FileText className="h-4 w-4 shrink-0 text-clay" aria-hidden="true" />
                  )}
                  <p className="truncate font-medium text-ink" title={doc.fileName}>
                    {doc.fileName}
                  </p>
                </div>
                <p className="mt-1 text-sm text-muted">
                  <span aria-hidden="true">{DOCUMENT_TYPE_EMOJI[doc.documentType]}</span>{" "}
                  {humanizeDocumentType(doc.documentType)} · {fileFormatLabel(doc.fileName)} ·{" "}
                  {doc.source === "scan" ? "Scanned" : "Uploaded"} ·{" "}
                  {meta.label} · {done} of {doc.fields.length} fields confirmed
                </p>
              </div>
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-sm font-medium ${meta.className}`}
              >
                <span aria-hidden="true">{meta.emoji}</span>
                {meta.label}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onReview(doc.documentId)}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-card border border-clay px-4 py-2 text-sm font-medium text-clay hover:bg-clay/10 focus-visible:outline-none"
              >
                <Eye className="h-4 w-4" aria-hidden="true" />
                Review
              </button>
              <button
                type="button"
                onClick={() => onReplace(doc.documentId)}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-card border border-line px-4 py-2 text-sm font-medium text-plum hover:bg-clay/10 focus-visible:outline-none"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Replace
              </button>
              <button
                type="button"
                onClick={() => onRemove(doc.documentId)}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-card border border-line px-4 py-2 text-sm font-medium text-danger hover:border-danger hover:bg-[#F8E4E3] focus-visible:outline-none"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Remove
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
