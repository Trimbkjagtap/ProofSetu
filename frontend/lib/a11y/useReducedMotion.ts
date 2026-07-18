"use client";

import { useEffect, useState } from "react";

/**
 * Tracks the OS-level `prefers-reduced-motion` setting. Combine with the app's
 * own reduced-motion preference to decide whether to animate.
 */
export function useSystemReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return reduced;
}
