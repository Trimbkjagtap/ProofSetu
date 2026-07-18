import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  Icon: LucideIcon;
  title: string;
  description?: string;
  children?: ReactNode;
}

/** Calm empty placeholder — no large hero, just guidance toward the next action. */
export function EmptyState({ Icon, title, description, children }: EmptyStateProps) {
  return (
    <div className="rounded-card border border-dashed border-line bg-paper p-8 text-center">
      <Icon className="mx-auto h-8 w-8 text-forest" aria-hidden="true" />
      <p className="mt-3 font-medium text-ink">{title}</p>
      {description && <p className="mx-auto mt-1 max-w-prose text-muted">{description}</p>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
