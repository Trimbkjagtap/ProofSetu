"use client";

import { useState } from "react";
import { LifeBuoy } from "lucide-react";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";

/** Help control. Opens a plain-language dialog explaining what ProofSetu does. */
export function HelpButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-[44px] items-center gap-2 rounded-card border border-line px-3 py-2 text-sm font-medium text-forest hover:bg-sage focus-visible:outline-none"
      >
        <LifeBuoy className="h-4 w-4" aria-hidden="true" />
        <span>Help</span>
      </button>

      <ConfirmationDialog
        open={open}
        title="How ProofSetu helps"
        confirmLabel="Got it"
        cancelLabel="Close"
        onConfirm={() => setOpen(false)}
        onCancel={() => setOpen(false)}
      >
        <span className="block">
          ProofSetu helps you gather housing documents, check the information we
          read from them, understand the published 2026 rules, and prepare a
          review-ready packet.
        </span>
        <span className="mt-3 block font-medium text-forest-dark">
          ProofSetu helps prepare your information. A housing professional makes the
          final decision.
        </span>
      </ConfirmationDialog>
    </>
  );
}
