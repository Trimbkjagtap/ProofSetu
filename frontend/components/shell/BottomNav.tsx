import type { ReactNode } from "react";

/**
 * Bottom navigation area that groups Back (left) and Continue/actions (right).
 * On small screens it stacks with the primary action on top.
 */
export function BottomNav({ children }: { children: ReactNode }) {
  return (
    <nav
      aria-label="Page navigation"
      className="mt-8 flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between"
    >
      {children}
    </nav>
  );
}
