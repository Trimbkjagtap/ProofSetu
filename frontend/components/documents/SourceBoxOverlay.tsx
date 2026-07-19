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
  /** Coordinate size of the displayed page image. PDF boxes may use a larger DPI. */
  pageWidth?: number;
  pageHeight?: number;
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
  pageWidth,
  pageHeight,
}: SourceBoxOverlayProps) {
  const boxes = fields.flatMap((field) =>
    field.sourceBox ? [field.sourceBox] : []
  );
  // When the backend supplies PDF coordinates at a larger DPI, use the observed
  // coordinate extent instead of placing those boxes beyond the displayed page.
  const resolvedPageWidth =
    pageWidth ?? Math.max(PAGE_WIDTH, ...boxes.map((box) => box.x + box.width));
  const resolvedPageHeight =
    pageHeight ?? Math.max(PAGE_HEIGHT, ...boxes.map((box) => box.y + box.height));

  return (
    <>
      {fields.map((field) => {
        const box = field.sourceBox;
        if (!box) return null;
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
              left: pct(box.x, resolvedPageWidth),
              top: pct(box.y, resolvedPageHeight),
              width: pct(box.width, resolvedPageWidth),
              height: pct(box.height, resolvedPageHeight),
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
