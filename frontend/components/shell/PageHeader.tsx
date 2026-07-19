import type { ReactNode } from "react";

interface PageHeaderProps {
  /** Small overline above the title (e.g. "Step 2 of 5"). */
  eyebrow?: string;
  title: string;
  /** Supporting sentence beneath the title. */
  description?: ReactNode;
}

/**
 * Centered page heading block. The <h1> anchors each page's heading order.
 * Titles/subtitles are centered and width-limited; page body content stays
 * left-aligned for scannability.
 */
export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <header className="mb-8 text-center">
      {eyebrow && (
        <p className="mb-1 text-sm font-medium uppercase tracking-wide text-clay">
          {eyebrow}
        </p>
      )}
      <h1 className="mx-auto max-w-title text-3xl sm:text-4xl">{title}</h1>
      {description && (
        <p className="mx-auto mt-3 max-w-[600px] text-lg text-muted">
          {description}
        </p>
      )}
    </header>
  );
}
