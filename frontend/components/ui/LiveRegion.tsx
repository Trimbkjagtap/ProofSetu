"use client";

import { useAnnounce } from "@/lib/a11y/AnnouncerContext";

/**
 * Visually hidden ARIA live region. Reads the current announcement to assistive
 * technology (loading, success, correction updates). Rendered once in the shell.
 */
export function LiveRegion() {
  const { announcement } = useAnnounce();
  return (
    <>
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announcement.politeness === "polite" ? announcement.message : ""}
      </div>
      <div className="sr-only" role="alert" aria-live="assertive" aria-atomic="true">
        {announcement.politeness === "assertive" ? announcement.message : ""}
      </div>
    </>
  );
}
