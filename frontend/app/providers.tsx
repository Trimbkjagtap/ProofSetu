"use client";

import type { ReactNode } from "react";
import { AppStateProvider } from "@/lib/state/AppContext";
import { AnnouncerProvider } from "@/lib/a11y/AnnouncerContext";
import { AppShell } from "@/components/shell/AppShell";

/** Composes app state + announcer contexts and wraps everything in the shell. */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <AppStateProvider>
      <AnnouncerProvider>
        <AppShell>{children}</AppShell>
      </AnnouncerProvider>
    </AppStateProvider>
  );
}
