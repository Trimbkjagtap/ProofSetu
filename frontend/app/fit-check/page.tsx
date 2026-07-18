import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/PageHeader";
import { FitCheckView } from "@/components/rules/FitCheckView";

export const metadata: Metadata = { title: "Income and the published limit" };

export default function FitCheckPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Step 3 of 5"
        title="Your income and the published limit"
        description="A neutral comparison of your confirmed income against the published 2026 rule. This does not determine eligibility."
      />
      <FitCheckView />
    </div>
  );
}
