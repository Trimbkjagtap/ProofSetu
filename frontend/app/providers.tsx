"use client";

import type { ReactNode } from "react";
import { AppStateProvider } from "@/lib/state/AppContext";
import { AnnouncerProvider } from "@/lib/a11y/AnnouncerContext";
import { InfoCenterProvider } from "@/components/shell/InfoCenter";
import { AppShell } from "@/components/shell/AppShell";

/** Composes app state + announcer + info-center contexts and the shell. */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <AppStateProvider>
      <AnnouncerProvider>
        <InfoCenterProvider>
          <AppShell>{children}</AppShell>
        </InfoCenterProvider>
      </AnnouncerProvider>
    </AppStateProvider>
  );
}
