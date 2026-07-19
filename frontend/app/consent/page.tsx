import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/PageHeader";
import { ConsentForm } from "@/components/consent/ConsentForm";
import { HowItWorksSlider } from "@/components/consent/HowItWorksSlider";

export const metadata: Metadata = { title: "Consent" };

export default function ConsentPage() {
  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="Step 1 of 5"
        title="Before we begin"
        description="Take a moment to see how your information is handled."
      />
      <div className="mb-6">
        <HowItWorksSlider />
      </div>
      <ConsentForm />
    </div>
  );
}
