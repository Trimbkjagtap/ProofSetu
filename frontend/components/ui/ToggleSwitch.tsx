"use client";

import { useId } from "react";

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description?: string;
}

/**
 * Accessible on/off switch (role="switch"). Conveys state with knob position
 * AND a text value ("On"/"Off"), never color alone. 44px minimum target.
 */
export function ToggleSwitch({
  checked,
  onChange,
  label,
  description,
}: ToggleSwitchProps) {
  const descId = useId();
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <span className="font-medium text-ink">{label}</span>
        {description && (
          <p id={descId} className="text-sm text-muted">
            {description}
          </p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        aria-describedby={description ? descId : undefined}
        onClick={() => onChange(!checked)}
        className="inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-full px-1 focus-visible:outline-none"
      >
        <span
          aria-hidden="true"
          className={[
            "relative flex h-7 w-12 items-center rounded-full border transition-colors",
            checked ? "border-forest bg-forest" : "border-line bg-sage",
          ].join(" ")}
        >
          <span
            className={[
              "absolute h-5 w-5 rounded-full bg-paper shadow-card transition-all",
              checked ? "left-[22px]" : "left-[2px]",
            ].join(" ")}
          />
        </span>
        <span className="w-8 text-left text-sm font-medium text-ink">
          {checked ? "On" : "Off"}
        </span>
      </button>
    </div>
  );
}
