import type {
  ChecklistResponse,
  ExtractionResponse,
  FieldUpdate,
  PacketResponse,
  ProfileResponse,
  RulesResponse,
  SessionResponse,
} from "@/types/domain";

/**
 * The transport contract every ProofSetu API client implements.
 * Components depend on THIS interface only — never on `fetch` directly —
 * so mock and live modes are fully interchangeable.
 */
export interface ProofSetuApi {
  createSession(): Promise<SessionResponse>;
  deleteSession(sessionId: string): Promise<{ deleted: true }>;
  uploadDocument(file: File): Promise<ExtractionResponse>;
  updateDocumentField(
    documentId: string,
    field: FieldUpdate
  ): Promise<ExtractionResponse>;
  getProfile(): Promise<ProfileResponse>;
  queryRules(question: string): Promise<RulesResponse>;
  getChecklist(): Promise<ChecklistResponse>;
  createPacket(): Promise<PacketResponse>;
  downloadPacket(packetId: string): Promise<{ downloadUrl: string }>;
}

/** Raised for any transport-level failure so the UI can show a retry state. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}
