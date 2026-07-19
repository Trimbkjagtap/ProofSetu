"use client";

import { useEffect, useState } from "react";

/** Tracks a media query. Starts false on the server; updates after mount. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const update = () => setMatches(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, [query]);

  return matches;
}

/** True on desktop-width viewports (Tailwind `lg`). */
export function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 1024px)");
}
