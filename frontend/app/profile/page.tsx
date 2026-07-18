import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/PageHeader";
import { ProfileWorkspace } from "@/components/profile/ProfileWorkspace";

export const metadata: Metadata = { title: "Your documents" };

export default function ProfilePage() {
  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="Step 2 of 5"
        title="Tell us about your household"
        description="Add your documents and confirm the details we find. You’re always in control of what’s used."
      />
      <ProfileWorkspace />
    </div>
  );
}
