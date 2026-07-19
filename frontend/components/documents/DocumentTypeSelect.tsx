"use client";

import { useId } from "react";
import { FileType2 } from "lucide-react";
import type { RequestedType } from "@/types/domain";
import { DOCUMENT_TYPE_OPTIONS, requestedTypeEmoji } from "@/lib/documents";

interface DocumentTypeSelectProps {
  value: RequestedType;
  onChange: (value: RequestedType) => void;
}

/** Lets the renter pick a document type, or ask ProofSetu to identify it. */
export function DocumentTypeSelect({ value, onChange }: DocumentTypeSelectProps) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="flex items-center gap-2 text-sm font-medium text-ink">
        <FileType2 className="h-4 w-4 text-clay" aria-hidden="true" />
        What kind of document is this?
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as RequestedType)}
        className="mt-1 min-h-[44px] w-full max-w-sm rounded-card border border-line bg-white px-3 py-2 text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay"
      >
        {DOCUMENT_TYPE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {requestedTypeEmoji(opt.value)}  {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
