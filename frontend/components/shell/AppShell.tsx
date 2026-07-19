"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { stepForPath, STEPS } from "@/lib/steps";
import { useApp } from "@/lib/state/AppContext";
import { Wordmark } from "./Wordmark";
import { StepProgress } from "./StepProgress";
import { HeaderNav } from "./HeaderNav";
import { Footer } from "./Footer";
import { HelpAssistant } from "@/components/help/HelpAssistant";
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
      <header className="sticky top-0 z-30 border-b border-line bg-cream px-4 pb-4 pt-4">
        <div className="mx-auto w-full max-w-shell rounded-[18px] border border-line bg-cream shadow-card backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
            <Wordmark />
            <HeaderNav />
          </div>

          {currentOrder > 0 && (
            <div className="border-t border-line px-4 py-3 sm:px-5">
              <div className="flex flex-col items-center gap-2">
                <StepProgress currentOrder={currentOrder} />
                <p className="text-sm text-muted">
                  Step {currentOrder} of {STEPS.length}
                  {current ? ` · ${current.name}` : ""}
                </p>
              </div>
            </div>
          )}
        </div>
      </header>

      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto w-full max-w-shell flex-1 px-4 py-10 focus-visible:outline-none sm:px-6"
      >
        {children}
      </main>

      <Footer />

      <HelpAssistant />
      <LiveRegion />
    </div>
  );
}
