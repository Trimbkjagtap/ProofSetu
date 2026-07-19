import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/PageHeader";
import { ReadinessView } from "@/components/readiness/ReadinessView";

export const metadata: Metadata = { title: "Document readiness" };

export default function ReadinessPage() {
  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="Step 4 of 5"
        title="See what’s ready and what needs attention"
        description="A quick check of your documents before you prepare your packet."
      />
      <ReadinessView />
    </div>
  );
}
