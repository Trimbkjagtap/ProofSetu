"use client";

import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import { Accessibility, LifeBuoy, Minus, Plus, ShieldCheck } from "lucide-react";
import { InfoDialog } from "@/components/ui/InfoDialog";
import { AccessibilityPreferences } from "@/components/consent/AccessibilityPreferences";

export type InfoKey = "how" | "privacy" | "accessibility" | "help";

interface InfoCenterValue {
  openInfo: (key: InfoKey) => void;
}

const InfoCenterContext = createContext<InfoCenterValue | null>(null);

const HOW_STEPS = [
  {
    title: "Add your documents",
    text: "Upload the files you already have or scan a document with your camera.",
  },
  {
    title: "Check the details",
    text: "Review what ProofSetu found. Confirm the correct information and change anything that looks wrong.",
  },
  {
    title: "See the calculation",
    text: "View the numbers alongside the published rule used for the comparison.",
  },
  {
    title: "Find what needs attention",
    text: "See which documents are ready, missing or expired.",
  },
  {
    title: "Review your packet",
    text: "Choose what to include, then download the packet when you’re ready.",
  },
] as const;

/**
 * One place that owns the shared informational dialogs (How it works, Privacy,
 * Accessibility, Help), so the header nav and the footer can open the same ones.
 */
export function InfoCenterProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState<InfoKey | null>(null);
  const [openHowStep, setOpenHowStep] = useState<number | null>(null);
  const accordionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const close = () => setOpen(null);

  function handleAccordionKeyDown(
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number
  ) {
    let nextIndex: number | null = null;
    if (event.key === "ArrowDown") nextIndex = (index + 1) % HOW_STEPS.length;
    if (event.key === "ArrowUp") nextIndex = (index - 1 + HOW_STEPS.length) % HOW_STEPS.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = HOW_STEPS.length - 1;
    if (nextIndex === null) return;
    event.preventDefault();
    accordionRefs.current[nextIndex]?.focus();
  }

  return (
    <InfoCenterContext.Provider value={{ openInfo: setOpen }}>
      {children}

      <InfoDialog open={open === "how"} title="How ProofSetu works" wide onClose={close}>
        <p className="mb-5 max-w-[600px] text-ink">
          Move through each step at your own pace. You can always go back and make a change.
        </p>

        <ol className="hidden space-y-3 md:block">
          {HOW_STEPS.map((step, index) => (
            <li key={step.title} className="flex items-start gap-3 rounded-card border border-line bg-cream/60 p-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-clay text-sm font-semibold text-white">
                {index + 1}
              </span>
              <div>
                <h3 className="text-base font-semibold text-ink">{step.title}</h3>
                <p className="mt-1 text-sm text-muted">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="divide-y divide-line rounded-card border border-line md:hidden">
          {HOW_STEPS.map((step, index) => {
            const isOpen = openHowStep === index;
            const bodyId = `how-step-${index}-body`;
            return (
              <div key={step.title}>
                <button
                  ref={(element) => {
                    accordionRefs.current[index] = element;
                  }}
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={bodyId}
                  onClick={() => setOpenHowStep(isOpen ? null : index)}
                  onKeyDown={(event) => handleAccordionKeyDown(event, index)}
                  className="flex min-h-[52px] w-full items-center justify-between gap-3 px-4 text-left font-semibold text-ink focus-visible:outline-none"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-clay text-xs font-semibold text-white">
                      {index + 1}
                    </span>
                    {step.title}
                  </span>
                  {isOpen ? (
                    <Minus className="h-4 w-4 shrink-0 text-clay" aria-hidden="true" />
                  ) : (
                    <Plus className="h-4 w-4 shrink-0 text-clay" aria-hidden="true" />
                  )}
                </button>
                {isOpen && (
                  <p id={bodyId} className="px-4 pb-4 pl-[3.25rem] text-sm text-muted">
                    {step.text}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </InfoDialog>

      <InfoDialog open={open === "privacy"} title="Your privacy" onClose={close}>
        <div className="mb-3 flex items-center gap-2 text-teal">
          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          <span className="text-sm font-medium">Session-only, synthetic data</span>
        </div>
        <p className="text-ink">
          This prototype uses <strong>synthetic documents only</strong>, never real
          personal information. Anything you add is kept in your browser for this
          visit and is removed when you choose “Delete everything.”
        </p>
        <p className="mt-3 text-muted">
          ProofSetu never determines eligibility. A housing professional makes the
          final decision.
        </p>
      </InfoDialog>

      <InfoDialog open={open === "accessibility"} title="Accessibility" onClose={close}>
        <div className="mb-4 flex items-center gap-2 text-navy">
          <Accessibility className="h-5 w-5" aria-hidden="true" />
          <span className="text-sm font-medium">Adjust how ProofSetu looks</span>
        </div>
        <AccessibilityPreferences />
      </InfoDialog>

      <InfoDialog open={open === "help"} title="Need a hand?" onClose={close}>
        <div className="mb-3 flex items-center gap-2 text-indigo">
          <LifeBuoy className="h-5 w-5" aria-hidden="true" />
          <span className="text-sm font-medium">What ProofSetu does</span>
        </div>
        <p className="text-ink">
          ProofSetu helps you gather housing documents, check the information found
          in them, understand the published 2026 rules, and prepare a review-ready
          packet.
        </p>
        <p className="mt-3 font-medium text-navy">
          ProofSetu helps prepare your information. A housing professional makes the
          final decision.
        </p>
      </InfoDialog>
    </InfoCenterContext.Provider>
  );
}

export function useInfoCenter(): InfoCenterValue {
  const ctx = useContext(InfoCenterContext);
  if (!ctx) throw new Error("useInfoCenter must be used within InfoCenterProvider");
  return ctx;
}
