import type { ReactNode } from "react";

interface PageHeaderProps {
  /** Small overline above the title (e.g. "Step 2 of 5"). */
  eyebrow?: string;
  title: string;
  /** Supporting sentence beneath the title. */
  description?: ReactNode;
}

/** Consistent page heading block. The <h1> anchors each page's heading order. */
export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <header className="mb-6">
      {eyebrow && (
        <p className="mb-1 text-sm font-medium uppercase tracking-wide text-muted">
          {eyebrow}
        </p>
      )}
      <h1 className="text-3xl">{title}</h1>
      {description && (
        <p className="mt-2 max-w-prose text-lg text-muted">{description}</p>
      )}
    </header>
  );
}
