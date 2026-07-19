import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/PageHeader";
import { FitCheckView } from "@/components/rules/FitCheckView";

export const metadata: Metadata = { title: "Income and the published limit" };

export default function FitCheckPage() {
  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="Step 3 of 5"
        title="Here’s how the numbers were worked out"
        description="A clear comparison using the information you confirmed."
      />
      <FitCheckView />
    </div>
  );
}
