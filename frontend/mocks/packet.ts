import type { PacketResponse } from "@/types/domain";

/**
 * Packet-preview fixture. Mirrors `contracts/packet-response.json`.
 * Only confirmed information is ever included.
 */
export const packetMock: PacketResponse = {
  packetId: "packet_001",
  status: "ready_for_preview",
  includedDocuments: ["pay_stub", "government_id"],
  confirmedFieldsOnly: true,
  downloadUrl: "/packet/packet_001/pdf",
};
