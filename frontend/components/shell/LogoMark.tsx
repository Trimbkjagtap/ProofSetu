interface LogoMarkProps {
  className?: string;
}

/**
 * ProofSetu logo mark: an evidence page with a checkmark, resting over a subtle
 * bridge arch ("Setu" = bridge). Drawn in currentColor so it inherits the
 * gradient container's white foreground. Decorative — the wordmark carries the name.
 */
export function LogoMark({ className = "" }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 28 28"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {/* Evidence page */}
      <rect
        x="7"
        y="3.5"
        width="14"
        height="15"
        rx="2.5"
        fill="currentColor"
        fillOpacity="0.14"
      />
      {/* Text lines */}
      <line x1="10" y1="8" x2="16" y2="8" />
      <line x1="10" y1="11" x2="14.5" y2="11" />
      {/* Checkmark */}
      <path d="M10 14.2 l2.1 2.1 l4.2 -4.4" strokeWidth={2.1} />
      {/* Bridge arch */}
      <path d="M3.5 24.5 Q14 18.5 24.5 24.5" strokeWidth={1.8} />
      <line x1="7.5" y1="22.1" x2="7.5" y2="25.2" strokeWidth={1.5} />
      <line x1="20.5" y1="22.1" x2="20.5" y2="25.2" strokeWidth={1.5} />
    </svg>
  );
}
