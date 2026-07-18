"use client";

import { FlaskConical } from "lucide-react";
import type { ExtractedField } from "@/types/domain";
import { SourceBoxOverlay, PAGE_WIDTH, PAGE_HEIGHT } from "./SourceBoxOverlay";
import { humanizeFieldName } from "@/lib/format";

interface DocumentPreviewProps {
  documentLabel: string;
  fields: ExtractedField[];
  activeName: string | null;
  onActivate: (name: string | null) => void;
}

/**
 * Synthetic document preview with evidence highlights. The page is a stylized
 * pay stub (prototype); hovering or focusing a highlight connects it to the
 * matching field card via the shared `activeName`.
 */
export function DocumentPreview({
  documentLabel,
  fields,
  activeName,
  onActivate,
}: DocumentPreviewProps) {
  return (
    <figure className="rounded-card border border-line bg-paper p-4 shadow-card">
      <figcaption className="mb-3 flex items-center gap-2 text-sm text-muted">
        <FlaskConical className="h-4 w-4 shrink-0 text-forest" aria-hidden="true" />
        <span>
          Synthetic {documentLabel.toLowerCase()} (prototype). Highlights show
          where each value was read.
        </span>
      </figcaption>

      <div
        className="relative mx-auto w-full overflow-hidden rounded-[4px] border border-line bg-white"
        style={{ aspectRatio: `${PAGE_WIDTH} / ${PAGE_HEIGHT}` }}
        role="img"
        aria-label={`Preview of a synthetic ${documentLabel.toLowerCase()} showing ${fields
          .map((f) => humanizeFieldName(f.name))
          .join(", ")}.`}
      >
        {/* Decorative document scaffolding. */}
        <div aria-hidden="true" className="absolute inset-0 p-[6%] text-[#0F352A]">
          <div className="border-b-2 border-forest/70 pb-2">
            <p className="font-serif text-[1.1rem] font-semibold">Riverside Staffing Co.</p>
            <p className="text-[0.7rem] text-muted">Earnings Statement</p>
          </div>
          <div className="mt-[8%] space-y-[3%]">
            <div className="h-2 w-2/5 rounded bg-line/70" />
            <div className="h-2 w-1/2 rounded bg-line/50" />
          </div>
          <div className="mt-[30%] space-y-[4%]">
            <div className="h-2 w-1/3 rounded bg-line/60" />
            <div className="h-2 w-3/5 rounded bg-line/40" />
            <div className="h-2 w-2/5 rounded bg-line/40" />
          </div>
        </div>

        {/* Evidence highlights (interactive). */}
        <SourceBoxOverlay
          fields={fields}
          activeName={activeName}
          onActivate={onActivate}
        />
      </div>
    </figure>
  );
}
