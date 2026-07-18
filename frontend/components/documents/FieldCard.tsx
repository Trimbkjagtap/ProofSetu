"use client";

import { useId, useState } from "react";
import { Check, Pencil, Undo2 } from "lucide-react";
import type { ExtractedField, FieldUpdate } from "@/types/domain";
import { useAnnounce } from "@/lib/a11y/AnnouncerContext";
import {
  formatFieldValue,
  humanizeFieldName,
  isCurrencyField,
} from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ConfidenceIndicator } from "@/components/ui/ConfidenceIndicator";

interface FieldCardProps {
  field: ExtractedField;
  /** The value originally read from the document (for Undo + corrected detection). */
  originalValue: string | number;
  isActive: boolean;
  onActivate: (name: string | null) => void;
  onUpdate: (update: FieldUpdate) => void;
}

/**
 * Editable extracted-field card. Every field can be confirmed as-is, corrected
 * to a new value, or undone back to what was originally read. State changes are
 * announced for screen-reader users.
 */
export function FieldCard({
  field,
  originalValue,
  isActive,
  onActivate,
  onUpdate,
}: FieldCardProps) {
  const numeric = typeof originalValue === "number";
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string>(String(field.value));
  const [inputError, setInputError] = useState<string | null>(null);
  const inputId = useId();
  const errorId = useId();
  const { announce } = useAnnounce();

  const label = humanizeFieldName(field.name);

  function startEdit() {
    setDraft(String(field.value));
    setInputError(null);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setInputError(null);
  }

  function save() {
    const trimmed = draft.trim();
    if (trimmed === "") {
      setInputError("Please enter a value.");
      return;
    }
    let nextValue: string | number = trimmed;
    if (numeric) {
      const parsed = Number(trimmed.replace(/[$,]/g, ""));
      if (Number.isNaN(parsed)) {
        setInputError("Please enter a number.");
        return;
      }
      nextValue = parsed;
    }

    const changed = String(nextValue) !== String(originalValue);
    const nextState = changed ? "corrected" : "confirmed";
    onUpdate({ name: field.name, value: nextValue, state: nextState });
    setEditing(false);
    announce(
      changed
        ? `${label} corrected to ${formatFieldValue({ name: field.name, value: nextValue })}.`
        : `${label} confirmed.`
    );
  }

  function confirm() {
    onUpdate({ name: field.name, value: field.value, state: "confirmed" });
    announce(`${label} confirmed.`);
  }

  function undo() {
    onUpdate({ name: field.name, value: originalValue, state: "unconfirmed" });
    announce(
      `${label} reset to the value we originally read: ${formatFieldValue({
        name: field.name,
        value: originalValue,
      })}.`
    );
  }

  const isSettled = field.state === "confirmed" || field.state === "corrected";

  return (
    <div
      onMouseEnter={() => onActivate(field.name)}
      onMouseLeave={() => onActivate(null)}
      className={[
        "rounded-card border bg-paper p-4 shadow-card transition-all duration-150 hover:shadow-raised",
        isActive ? "border-citation ring-1 ring-citation/40" : "border-line",
      ].join(" ")}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-serif text-base font-semibold text-forest-dark">
          {label}
        </h3>
        <StatusBadge kind="field" status={field.state} />
      </div>

      {editing ? (
        <div className="mt-3">
          <label htmlFor={inputId} className="block text-sm font-medium text-ink">
            {label}
          </label>
          <div className="mt-1 flex items-center gap-2">
            {isCurrencyField(field) && (
              <span className="text-muted" aria-hidden="true">
                $
              </span>
            )}
            <input
              id={inputId}
              value={draft}
              inputMode={numeric ? "decimal" : "text"}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") save();
                if (e.key === "Escape") cancelEdit();
              }}
              aria-invalid={inputError ? true : undefined}
              aria-describedby={inputError ? errorId : undefined}
              autoFocus
              className="min-h-[44px] w-full rounded-card border border-line bg-white px-3 py-2 text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-citation"
            />
          </div>
          {inputError && (
            <p id={errorId} role="alert" className="mt-1 text-sm text-danger">
              {inputError}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="primary" onClick={save}>
              <Check className="h-4 w-4" aria-hidden="true" />
              Save change
            </Button>
            <Button variant="secondary" onClick={cancelEdit}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <>
          <p className="mt-2 text-2xl font-semibold text-ink">
            {formatFieldValue(field)}
          </p>
          <div className="mt-1">
            <ConfidenceIndicator confidence={field.confidence} />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {!isSettled && (
              <Button variant="primary" onClick={confirm}>
                <Check className="h-4 w-4" aria-hidden="true" />
                Confirm
              </Button>
            )}
            <Button variant="secondary" onClick={startEdit}>
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Change
            </Button>
            {isSettled && (
              <Button variant="ghost" onClick={undo}>
                <Undo2 className="h-4 w-4" aria-hidden="true" />
                Undo
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
