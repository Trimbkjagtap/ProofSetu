"use client";

import { Settings2 } from "lucide-react";
import { useApp } from "@/lib/state/AppContext";
import { useAnnounce } from "@/lib/a11y/AnnouncerContext";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";

/**
 * Accessibility preferences. Changes apply immediately across the app (the shell
 * reads these from context) so renters can adjust before starting.
 */
export function AccessibilityPreferences() {
  const { state, dispatch } = useApp();
  const { announce } = useAnnounce();

  return (
    <section
      aria-labelledby="a11y-prefs-heading"
      className="rounded-card border border-line bg-paper p-5 shadow-card"
    >
      <div className="flex items-center gap-2">
        <Settings2 className="h-5 w-5 text-forest" aria-hidden="true" />
        <h2 id="a11y-prefs-heading" className="text-lg">
          Display preferences
        </h2>
      </div>
      <p className="mt-1 text-sm text-muted">
        These apply right away and stay on throughout your session.
      </p>

      <div className="mt-4 space-y-4">
        <ToggleSwitch
          label="Larger text"
          description="Increase the text size across every page."
          checked={state.prefs.largerText}
          onChange={(next) => {
            dispatch({ type: "SET_PREF", key: "largerText", value: next });
            announce(next ? "Larger text turned on." : "Larger text turned off.");
          }}
        />
        <ToggleSwitch
          label="Reduced motion"
          description="Minimize animations and transitions."
          checked={state.prefs.reducedMotion}
          onChange={(next) => {
            dispatch({ type: "SET_PREF", key: "reducedMotion", value: next });
            announce(
              next ? "Reduced motion turned on." : "Reduced motion turned off."
            );
          }}
        />
      </div>
    </section>
  );
}
