"use client";

import { useId, useState } from "react";
import { PlusCircle } from "lucide-react";
import type { ExtractedField } from "@/types/domain";
import { Button } from "@/components/ui/Button";

interface ManualEntryProps {
  /** Adds a manually entered (already-confirmed) field to the document. */
  onAdd: (field: ExtractedField) => void;
}

/** Lets the renter add details by hand when extraction found nothing. */
export function ManualEntry({ onAdd }: ManualEntryProps) {
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");
  const labelId = useId();
  const valueId = useId();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedLabel = label.trim();
    const trimmedValue = value.trim();
    if (!trimmedLabel || !trimmedValue) return;
    const name = trimmedLabel.toLowerCase().replace(/\s+/g, "_");
    onAdd({
      name,
      value: trimmedValue,
      confidence: 1,
      state: "corrected",
      sourceBox: { page: 1, x: 0, y: 0, width: 0, height: 0 },
      manual: true,
      evidenceText: "Entered manually",
    });
    setLabel("");
    setValue("");
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-card border border-line bg-cream p-4 shadow-card"
    >
      <div className="flex items-center gap-2">
        <PlusCircle className="h-5 w-5 text-clay" aria-hidden="true" />
        <h3 className="text-base font-semibold text-plum">Enter a detail yourself</h3>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={labelId} className="block text-sm font-medium text-ink">
            Detail
          </label>
          <input
            id={labelId}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Full name"
            className="mt-1 min-h-[44px] w-full rounded-card border border-line bg-white px-3 py-2 text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay"
          />
        </div>
        <div>
          <label htmlFor={valueId} className="block text-sm font-medium text-ink">
            Value
          </label>
          <input
            id={valueId}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="e.g. Maria Santos"
            className="mt-1 min-h-[44px] w-full rounded-card border border-line bg-white px-3 py-2 text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay"
          />
        </div>
      </div>
      <Button
        type="submit"
        variant="primary"
        className="mt-3"
        disabled={!label.trim() || !value.trim()}
      >
        Add detail
      </Button>
    </form>
  );
}
