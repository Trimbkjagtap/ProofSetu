"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { stepForPath, STEPS } from "@/lib/steps";
import { useApp } from "@/lib/state/AppContext";
import { Wordmark } from "./Wordmark";
import { StepProgress } from "./StepProgress";
import { HelpButton } from "./HelpButton";
import { DeleteSessionButton } from "./DeleteSessionButton";
import { PrivacyNotice } from "./PrivacyNotice";
import { LiveRegion } from "@/components/ui/LiveRegion";

/**
 * Shared application shell: wordmark, five-step progress, current step name,
 * persistent Help and "Delete everything" controls, the main content region,
 * and the session/privacy notice. Wraps every route.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const current = stepForPath(pathname ?? "");
  const currentOrder = current?.order ?? 0;
  const { state } = useApp();

  const wrapperClass = [
    "min-h-screen flex flex-col",
    state.prefs.largerText ? "text-larger" : "",
    state.prefs.reducedMotion ? "reduce-motion" : "",
  ].join(" ");

  return (
    <div className={wrapperClass}>
      <header className="border-b border-line bg-paper">
        <div className="mx-auto w-full max-w-5xl px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Wordmark />
            <div className="flex items-center gap-2">
              <HelpButton />
              <DeleteSessionButton compact />
            </div>
          </div>

          {currentOrder > 0 && (
            <div className="mt-4 border-t border-line pt-3">
              <StepProgress currentOrder={currentOrder} />
              <p className="mt-2 text-sm text-muted">
                Step {currentOrder} of {STEPS.length}
                {current ? ` · ${current.name}` : ""}
              </p>
            </div>
          )}
        </div>
      </header>

      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 focus-visible:outline-none"
      >
        {children}
      </main>

      <footer className="border-t border-line bg-paper">
        <div className="mx-auto w-full max-w-5xl px-4 py-5">
          <PrivacyNotice />
        </div>
      </footer>

      <LiveRegion />
    </div>
  );
}
