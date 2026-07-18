import Link from "next/link";
import { Home } from "lucide-react";

/** ProofSetu wordmark. Text-based, no logo image — clear and lightweight. */
export function Wordmark() {
  return (
    <Link
      href="/consent"
      className="inline-flex items-center gap-2 rounded focus-visible:outline-none"
      aria-label="ProofSetu home"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-card bg-forest text-paper">
        <Home className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="font-serif text-xl font-semibold text-forest-dark">
        ProofSetu
      </span>
    </Link>
  );
}
