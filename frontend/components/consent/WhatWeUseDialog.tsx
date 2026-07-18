"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import { InfoDialog } from "@/components/ui/InfoDialog";

/** The information ProofSetu reads from synthetic documents, and why. */
const USED_FIELDS: { label: string; purpose: string }[] = [
  { label: "Name on the document", purpose: "To match documents to your household." },
  { label: "Gross pay amount", purpose: "To show the published income calculation." },
  { label: "Pay frequency", purpose: "To annualize income using the program rule." },
  { label: "Document type & dates", purpose: "To check whether documents are current." },
];

/** "See what information we use" disclosure — opens an accessible modal. */
export function WhatWeUseDialog() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-[44px] items-center gap-2 text-forest underline underline-offset-4 hover:text-forest-dark focus-visible:outline-none"
      >
        <FileText className="h-4 w-4" aria-hidden="true" />
        See what information we use
      </button>

      <InfoDialog
        open={open}
        title="Information ProofSetu reads"
        onClose={() => setOpen(false)}
      >
        <p className="text-muted">
          From your synthetic documents, ProofSetu reads only these details. You
          confirm every one before it is used.
        </p>
        <ul className="mt-4 space-y-3">
          {USED_FIELDS.map((f) => (
            <li key={f.label} className="border-t border-line pt-3 first:border-t-0 first:pt-0">
              <p className="font-medium text-ink">{f.label}</p>
              <p className="text-sm text-muted">{f.purpose}</p>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-muted">
          Retention: this information is stored temporarily for your session and is
          removed when you choose “Delete everything.”
        </p>
      </InfoDialog>
    </>
  );
}
