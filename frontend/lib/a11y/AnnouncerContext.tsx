"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useAnnouncer, type Announcement, type Politeness } from "./announcer";

interface AnnouncerValue {
  announcement: Announcement;
  announce: (message: string, politeness?: Politeness) => void;
}

const AnnouncerContext = createContext<AnnouncerValue | null>(null);

/**
 * Provides a single app-wide announcer. The <LiveRegion> in the shell renders
 * its current message so any component can push screen-reader updates.
 */
export function AnnouncerProvider({ children }: { children: ReactNode }) {
  const value = useAnnouncer();
  return (
    <AnnouncerContext.Provider value={value}>
      {children}
    </AnnouncerContext.Provider>
  );
}

export function useAnnounce(): AnnouncerValue {
  const ctx = useContext(AnnouncerContext);
  if (!ctx) {
    throw new Error("useAnnounce must be used within an AnnouncerProvider");
  }
  return ctx;
}
