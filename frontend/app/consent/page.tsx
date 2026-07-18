import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/PageHeader";
import { ConsentForm } from "@/components/consent/ConsentForm";

export const metadata: Metadata = { title: "Consent" };

export default function ConsentPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Step 1 of 5"
        title="Get your housing documents review-ready"
        description="From scattered documents to a review-ready housing packet."
      />
      <ConsentForm />
    </div>
  );
}
