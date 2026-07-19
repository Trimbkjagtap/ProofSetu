import Link from "next/link";
import { LogoMark } from "./LogoMark";

/** ProofSetu brand: gradient logo tile + name + a short, natural subtitle. */
export function Wordmark() {
  return (
    <Link
      href="/consent"
      className="group inline-flex items-center gap-3 rounded-card focus-visible:outline-none"
      aria-label="ProofSetu home"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-card bg-primary-gradient text-white shadow-card transition-shadow duration-200 group-hover:shadow-raised">
        <LogoMark className="h-6 w-6" />
      </span>
      <span className="flex flex-col leading-tight">
        <span className="font-serif text-xl font-semibold text-forest-dark">
          ProofSetu
        </span>
        <span className="text-xs text-muted">
          Documents made easier to review
        </span>
      </span>
    </Link>
  );
}
