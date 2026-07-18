import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/PageHeader";
import { ReadinessView } from "@/components/readiness/ReadinessView";

export const metadata: Metadata = { title: "Document readiness" };

export default function ReadinessPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Step 4 of 5"
        title="Check your documents"
        description="See which documents are present, missing, expiring, or expired. This checklist helps you prepare — it is not an eligibility score."
      />
      <ReadinessView />
    </div>
  );
}
