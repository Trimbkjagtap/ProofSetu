"use client";

import { useCallback, useState } from "react";

export type Politeness = "polite" | "assertive";

export interface Announcement {
  message: string;
  politeness: Politeness;
  /** Bump on every announce() so identical repeated messages still fire. */
  key: number;
}

/**
 * Local announcer hook. Pair with the <LiveRegion> component to read updates
 * (loading, success, corrections) to assistive technology.
 */
export function useAnnouncer() {
  const [announcement, setAnnouncement] = useState<Announcement>({
    message: "",
    politeness: "polite",
    key: 0,
  });

  const announce = useCallback(
    (message: string, politeness: Politeness = "polite") => {
      setAnnouncement((prev) => ({ message, politeness, key: prev.key + 1 }));
    },
    []
  );

  return { announcement, announce };
}
