"use client";

import { useId, type ReactNode } from "react";
import { useFocusTrap } from "@/lib/a11y/useFocusTrap";
import { Button } from "./Button";

interface ConfirmationDialogProps {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  /** Use the danger style for destructive confirmations. */
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Accessible modal dialog: focus is trapped inside while open, Escape cancels,
 * and focus is restored to the trigger on close (handled by useFocusTrap).
 */
export function ConfirmationDialog({
  open,
  title,
  children,
  confirmLabel,
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  const containerRef = useFocusTrap<HTMLDivElement>(open, onCancel);
  const titleId = useId();
  const descId = useId();

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      // Backdrop click cancels; the dialog itself stops propagation.
      onMouseDown={onCancel}
    >
      <div className="absolute inset-0 bg-ink/40" aria-hidden="true" />
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="relative z-10 w-full max-w-md rounded-card border border-line bg-paper p-6 shadow-raised"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className="text-xl">
          {title}
        </h2>
        <div id={descId} className="mt-3 text-muted">
          {children}
        </div>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? "danger" : "primary"}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
