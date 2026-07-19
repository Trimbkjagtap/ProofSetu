import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/PageHeader";
import { PacketView } from "@/components/packet/PacketView";

export const metadata: Metadata = { title: "Your review-ready packet" };

export default function PacketPage() {
  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="Step 5 of 5"
        title="Your packet, ready for one final look"
        description="Check the information and documents before downloading."
      />
      <PacketView />
    </div>
  );
}
