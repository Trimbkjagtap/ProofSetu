import { Gauge } from "lucide-react";

interface ConfidenceIndicatorProps {
  /** 0..1 confidence value. */
  confidence: number;
}

/**
 * Plain-language confidence label. Uses words + an icon, not color alone, and
 * deliberately avoids score/percentage framing that could imply a verdict.
 */
export function ConfidenceIndicator({ confidence }: ConfidenceIndicatorProps) {
  const pct = Math.round(confidence * 100);
  const label =
    confidence >= 0.9 ? "High confidence" : confidence >= 0.75 ? "Medium confidence" : "Please double-check";

  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-muted">
      <Gauge className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>
        {label}
        <span className="sr-only"> ({pct} percent reading confidence)</span>
      </span>
    </span>
  );
}
