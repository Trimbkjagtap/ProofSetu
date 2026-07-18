"use client";

import { Check } from "lucide-react";
import { STEPS } from "@/lib/steps";

interface StepProgressProps {
  /** 1-based order of the current step. */
  currentOrder: number;
}

/**
 * Five-step progress indicator. Semantic ordered list; the current step is
 * marked with aria-current, completed steps announce "completed", and status is
 * conveyed with an icon + text, never color alone.
 */
export function StepProgress({ currentOrder }: StepProgressProps) {
  return (
    <nav aria-label="Application progress">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-2">
        {STEPS.map((step, i) => {
          const isCurrent = step.order === currentOrder;
          const isComplete = step.order < currentOrder;
          return (
            <li key={step.path} className="flex items-center gap-2">
              <span
                className="flex items-center gap-2"
                aria-current={isCurrent ? "step" : undefined}
              >
                <span
                  className={[
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm font-semibold",
                    isCurrent
                      ? "border-forest bg-forest text-paper"
                      : isComplete
                        ? "border-forest bg-sage text-forest-dark"
                        : "border-line bg-paper text-muted",
                  ].join(" ")}
                >
                  {isComplete ? (
                    <Check className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    step.order
                  )}
                </span>
                <span
                  className={[
                    "text-sm",
                    isCurrent
                      ? "font-semibold text-ink"
                      : "text-muted",
                  ].join(" ")}
                >
                  {step.label}
                  {isComplete && <span className="sr-only"> (completed)</span>}
                </span>
              </span>
              {i < STEPS.length - 1 && (
                <span
                  aria-hidden="true"
                  className="hidden h-px w-6 bg-line sm:block"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
