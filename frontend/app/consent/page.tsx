import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/PageHeader";
import { ConsentForm } from "@/components/consent/ConsentForm";

export const metadata: Metadata = { title: "Consent" };

export default function ConsentPage() {
  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="Step 1 of 5"
        title="Let’s get your documents ready"
        description="We’ll help you organize your information before a housing professional reviews it."
      />
      <ConsentForm />
    </div>
  );
}
