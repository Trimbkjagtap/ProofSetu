"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { useApp } from "@/lib/state/AppContext";
import { useAnnounce } from "@/lib/a11y/AnnouncerContext";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";

interface DeleteSessionButtonProps {
  /** Compact variant for the header; full-width for in-page use. */
  compact?: boolean;
}

/**
 * Persistent "Delete everything" control. Opens an accessible confirmation
 * dialog, deletes the session, clears state, and returns to the start.
 */
export function DeleteSessionButton({ compact = false }: DeleteSessionButtonProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const { state, dispatch } = useApp();
  const { announce } = useAnnounce();
  const router = useRouter();

  async function handleDelete() {
    setBusy(true);
    try {
      if (state.session) {
        await apiClient.deleteSession(state.session.sessionId);
      }
      dispatch({ type: "RESET" });
      announce("Everything has been deleted. You are back at the start.", "assertive");
      setOpen(false);
      router.push("/consent");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={[
          "inline-flex min-h-[44px] items-center gap-2 rounded-card border border-line px-3 py-2 text-sm font-medium text-danger",
          "hover:border-danger hover:bg-[#FCEBEA] focus-visible:outline-none",
          compact ? "" : "w-full justify-center",
        ].join(" ")}
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
        <span>Delete everything</span>
      </button>

      <ConfirmationDialog
        open={open}
        title="Delete everything?"
        confirmLabel={busy ? "Deleting…" : "Yes, delete everything"}
        cancelLabel="Keep my information"
        destructive
        onConfirm={handleDelete}
        onCancel={() => !busy && setOpen(false)}
      >
        This permanently removes your session information, including every uploaded
        document, confirmed detail, and document selection. You cannot undo this,
        and you will start over from the beginning.
      </ConfirmationDialog>
    </>
  );
}
