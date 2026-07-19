import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/PageHeader";
import { ProfileWorkspace } from "@/components/profile/ProfileWorkspace";

export const metadata: Metadata = { title: "Your documents" };

export default function ProfilePage() {
  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="Step 2 of 5"
        title="Add and check your documents"
        description="We’ll show what we found so you can confirm or change each detail."
      />
      <ProfileWorkspace />
    </div>
  );
}
