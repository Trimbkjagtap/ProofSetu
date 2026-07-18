import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/PageHeader";
import { PacketView } from "@/components/packet/PacketView";

export const metadata: Metadata = { title: "Your review-ready packet" };

export default function PacketPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Step 5 of 5"
        title="Your review-ready packet"
        description="Review what goes into your packet. Only information you confirmed will be included."
      />
      <PacketView />
    </div>
  );
}
