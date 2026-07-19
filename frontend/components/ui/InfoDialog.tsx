"use client";

import { useId, type ReactNode } from "react";
import { X } from "lucide-react";
import { useFocusTrap } from "@/lib/a11y/useFocusTrap";
import { Button } from "./Button";

interface InfoDialogProps {
  open: boolean;
  title: string;
  children: ReactNode;
  closeLabel?: string;
  wide?: boolean;
  onClose: () => void;
}

/**
 * Accessible informational modal (single "close" affordance). Focus is trapped
 * while open, Escape closes, and focus returns to the trigger on close.
 */
export function InfoDialog({
  open,
  title,
  children,
  closeLabel = "Close",
  wide = false,
  onClose,
}: InfoDialogProps) {
  const containerRef = useFocusTrap<HTMLDivElement>(open, onClose);
  const titleId = useId();

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onMouseDown={onClose}
    >
      <div className="absolute inset-0 bg-ink/40" aria-hidden="true" />
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={[
          "relative z-10 w-full rounded-card border border-line bg-paper p-6 shadow-raised",
          wide ? "max-w-[700px]" : "max-w-lg",
        ].join(" ")}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-xl">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-card border border-line text-muted hover:bg-sage focus-visible:outline-none"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <div className="mt-3 text-ink">{children}</div>
        <div className="mt-6 flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            {closeLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
