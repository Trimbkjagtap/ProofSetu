import { ShieldCheck } from "lucide-react";

/** Persistent session/privacy reminder shown in the shell footer. */
export function PrivacyNotice() {
  return (
    <div className="flex items-start gap-2 text-sm text-muted">
      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-forest" aria-hidden="true" />
      <p className="max-w-prose">
        This prototype uses <strong>synthetic documents only</strong>. Your
        information is stored temporarily for this session and is removed when you
        choose “Delete everything.” ProofSetu never determines eligibility.
      </p>
    </div>
  );
}
