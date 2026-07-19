import Link from "next/link";
import { LogoMark } from "./LogoMark";

/** ProofSetu brand: warm gradient logo tile + name + a short editorial subtitle. */
export function Wordmark() {
  return (
    <Link
      href="/consent"
      className="group inline-flex items-center gap-3 rounded-card focus-visible:outline-none"
      aria-label="ProofSetu home"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-primary-gradient p-2.5 text-white shadow-clay transition-shadow duration-200 group-hover:shadow-raised">
        <LogoMark className="h-full w-full" />
      </span>
      <span className="flex flex-col leading-tight">
        <span className="font-serif text-xl font-semibold text-plum">
          ProofSetu
        </span>
        <span className="hidden max-w-[480px] text-xs text-muted sm:block">
          Bring your documents together, check the details, and prepare for your
          next conversation.
        </span>
      </span>
    </Link>
  );
}
