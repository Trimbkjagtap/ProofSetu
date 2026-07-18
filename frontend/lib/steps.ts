/** The frozen five-step renter journey, in order. Shared by the shell + progress. */
export interface JourneyStep {
  /** 1-based position. */
  order: number;
  /** Route path. */
  path: string;
  /** Short label for the progress indicator. */
  label: string;
  /** Full current-step name shown in the shell. */
  name: string;
}

export const STEPS: readonly JourneyStep[] = [
  { order: 1, path: "/consent", label: "Consent", name: "Consent" },
  { order: 2, path: "/profile", label: "Profile", name: "Your documents" },
  { order: 3, path: "/fit-check", label: "Fit check", name: "Income and the published limit" },
  { order: 4, path: "/readiness", label: "Readiness", name: "Document readiness" },
  { order: 5, path: "/packet", label: "Packet", name: "Your review-ready packet" },
] as const;

export function stepForPath(pathname: string): JourneyStep | undefined {
  return STEPS.find((s) => pathname.startsWith(s.path));
}
