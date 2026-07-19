interface BotFaceProps {
  className?: string;
}

/** Friendly assistant bot face (not a plain question mark). Uses currentColor. */
export function BotFace({ className = "" }: BotFaceProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {/* Antenna */}
      <line x1="16" y1="4" x2="16" y2="7.5" />
      <circle cx="16" cy="3" r="1.4" fill="currentColor" stroke="none" />
      {/* Head */}
      <rect x="6.5" y="8" width="19" height="15" rx="6" fill="currentColor" fillOpacity="0.16" />
      {/* Eyes */}
      <circle cx="12.5" cy="15" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="19.5" cy="15" r="1.5" fill="currentColor" stroke="none" />
      {/* Friendly smile */}
      <path d="M12.5 18.5 q3.5 3 7 0" />
      {/* Ears */}
      <line x1="6.5" y1="14" x2="5" y2="14" />
      <line x1="25.5" y1="14" x2="27" y2="14" />
    </svg>
  );
}
