"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const currentStep = STEPS.find((step) => step.order === currentOrder);

  useEffect(() => {
    if (!menuOpen) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!menuRef.current?.contains(target)) setMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setMenuOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);

  function goToStep(path: string, order: number) {
    if (order >= currentOrder) return;
    setMenuOpen(false);
    router.push(path);
  }

  return (
    <nav aria-label="Application progress" className="w-full">
      <div className="relative mx-auto w-full max-w-[320px] md:hidden" ref={menuRef}>
        <button
          ref={triggerRef}
          type="button"
          aria-expanded={menuOpen}
          aria-controls="mobile-step-menu"
          aria-label="Choose a completed step"
          onClick={() => setMenuOpen((open) => !open)}
          className="flex min-h-[44px] w-full items-center justify-between rounded-card border border-line bg-paper px-3 text-left text-sm font-medium text-ink shadow-card focus-visible:outline-none"
        >
          <span>
            Step {currentOrder} of {STEPS.length}: {currentStep?.label}
          </span>
          <ChevronDown
            className={["h-4 w-4 text-muted transition-transform", menuOpen ? "rotate-180" : ""].join(" ")}
            aria-hidden="true"
          />
        </button>

        {menuOpen && (
          <div
            id="mobile-step-menu"
            role="menu"
            aria-label="Application steps"
            className="menu-panel absolute left-0 right-0 top-full z-20 mt-2 rounded-card border border-line bg-paper p-2 shadow-raised"
          >
            {STEPS.map((step) => {
              const isCurrent = step.order === currentOrder;
              const isComplete = step.order < currentOrder;
              return (
                <button
                  key={step.path}
                  type="button"
                  role="menuitem"
                  disabled={!isComplete}
                  aria-current={isCurrent ? "step" : undefined}
                  onClick={() => goToStep(step.path, step.order)}
                  className={[
                    "flex min-h-[44px] w-full items-center gap-2 rounded-card px-3 text-left text-sm focus-visible:outline-none",
                    isCurrent
                      ? "bg-blush font-semibold text-ink"
                      : isComplete
                        ? "text-ink hover:bg-sage"
                        : "cursor-not-allowed text-muted/60",
                  ].join(" ")}
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                    {isComplete && <Check className="h-4 w-4 text-clay" aria-hidden="true" />}
                  </span>
                  <span>{step.order}. {step.label}</span>
                  {isCurrent && <span className="sr-only"> (current step)</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <ol className="hidden flex-wrap items-center justify-center gap-x-2 gap-y-2 md:flex">
        {STEPS.map((step, i) => {
          const isCurrent = step.order === currentOrder;
          const isComplete = step.order < currentOrder;
          return (
            <li key={step.path} className="flex items-center gap-2">
              <span className="flex items-center gap-2" aria-current={isCurrent ? "step" : undefined}>
                <span
                  className={[
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm font-semibold",
                    isCurrent
                      ? "border-transparent bg-primary-gradient text-white"
                      : isComplete
                        ? "border-clay bg-[#F4E4E0] text-clay"
                        : "border-line bg-paper text-muted",
                  ].join(" ")}
                >
                  {isComplete ? (
                    <Check className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    step.order
                  )}
                </span>
                {isComplete ? (
                  <button
                    type="button"
                    onClick={() => goToStep(step.path, step.order)}
                    className="text-sm text-muted hover:text-ink focus-visible:outline-none"
                    aria-label={`Return to ${step.label}`}
                  >
                    {step.label}
                    <span className="sr-only"> (completed)</span>
                  </button>
                ) : (
                  <span className={isCurrent ? "text-sm font-semibold text-ink" : "text-sm text-muted"}>
                    {step.label}
                  </span>
                )}
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
