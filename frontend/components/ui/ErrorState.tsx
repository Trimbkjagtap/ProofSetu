import { AlertCircle } from "lucide-react";
import { Button } from "./Button";

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

/** Accessible error panel with an optional retry. Announced assertively. */
export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="rounded-card border border-danger/40 bg-[#FCEBEA] p-4"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-danger" aria-hidden="true" />
        <div className="flex-1">
          <p className="font-medium text-danger">{title}</p>
          <p className="mt-1 text-ink">{message}</p>
          {onRetry && (
            <Button variant="secondary" className="mt-3" onClick={onRetry}>
              Try again
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
