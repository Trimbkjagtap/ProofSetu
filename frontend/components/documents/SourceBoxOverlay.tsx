"use client";

import type { ExtractedField } from "@/types/domain";
import { formatFieldValue, humanizeFieldName } from "@/lib/format";

/** Virtual page coordinate space the sourceBox values are expressed in. */
export const PAGE_WIDTH = 612;
export const PAGE_HEIGHT = 792;

interface SourceBoxOverlayProps {
  /** Original extracted fields — the boxes show what was read from the document. */
  fields: ExtractedField[];
  /** Name of the currently highlighted field (hover/focus), if any. */
  activeName: string | null;
  onActivate: (name: string | null) => void;
}

function pct(value: number, total: number): string {
  return `${(value / total) * 100}%`;
}

/**
 * Evidence highlights drawn over the document preview. Each box marks where a
 * value was read. The active box is emphasized; boxes use citation blue (not a
 * success/error color) since they convey location, not a verdict.
 */
export function SourceBoxOverlay({
  fields,
  activeName,
  onActivate,
}: SourceBoxOverlayProps) {
  return (
    <>
      {fields.map((field) => {
        const { sourceBox: box } = field;
        const isActive = activeName === field.name;
        return (
          <button
            key={field.name}
            type="button"
            onMouseEnter={() => onActivate(field.name)}
            onMouseLeave={() => onActivate(null)}
            onFocus={() => onActivate(field.name)}
            onBlur={() => onActivate(null)}
            aria-label={`Evidence for ${humanizeFieldName(field.name)}: ${formatFieldValue(field)}`}
            style={{
              left: pct(box.x, PAGE_WIDTH),
              top: pct(box.y, PAGE_HEIGHT),
              width: pct(box.width, PAGE_WIDTH),
              height: pct(box.height, PAGE_HEIGHT),
            }}
            className={[
              "absolute flex items-center overflow-hidden rounded-[3px] px-1 text-left text-[0.7rem] leading-none transition-colors focus-visible:outline-none",
              isActive
                ? "border-2 border-citation bg-citation/15 text-citation ring-2 ring-citation/30"
                : "border border-dashed border-citation/60 bg-citation/5 text-ink/70 hover:bg-citation/10",
            ].join(" ")}
          >
            <span className="truncate font-medium">{formatFieldValue(field)}</span>
          </button>
        );
      })}
    </>
  );
}
