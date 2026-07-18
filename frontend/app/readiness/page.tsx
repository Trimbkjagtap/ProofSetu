import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/PageHeader";
import { ReadinessView } from "@/components/readiness/ReadinessView";

export const metadata: Metadata = { title: "Document readiness" };

export default function ReadinessPage() {
  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="Step 4 of 5"
        title="Let’s check your documents"
        description="See what is ready and what still needs your attention."
      />
      <ReadinessView />
    </div>
  );
}
