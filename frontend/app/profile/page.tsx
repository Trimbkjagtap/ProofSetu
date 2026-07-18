import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/PageHeader";
import { ProfileWorkspace } from "@/components/profile/ProfileWorkspace";

export const metadata: Metadata = { title: "Your documents" };

export default function ProfilePage() {
  return (
    <div>
      <PageHeader
        eyebrow="Step 2 of 5"
        title="Your documents"
        description="Upload synthetic documents and confirm the information we read from them."
      />
      <ProfileWorkspace />
    </div>
  );
}
