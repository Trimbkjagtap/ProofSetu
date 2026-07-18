import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  label?: string;
}

/** Inline loading indicator. `role=status` + aria-live announce it politely. */
export function LoadingState({ label = "Loading…" }: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-3 rounded-card border border-line bg-paper p-4 text-muted"
    >
      <Loader2 className="h-5 w-5 animate-spin text-forest" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
