import type {
  ChecklistResponse,
  ExtractionResponse,
  FieldUpdate,
  PacketResponse,
  ProfileField,
  ProfileResponse,
  RequestedType,
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
  uploadDocument(
    file: File,
    sessionId: string,
    requestedType?: RequestedType
  ): Promise<ExtractionResponse>;
  updateDocumentField(
    documentId: string,
    field: FieldUpdate
  ): Promise<ExtractionResponse | null>;
  getProfile(sessionId: string): Promise<ProfileResponse>;
  queryRules(question: string, context: RulesQueryInput): Promise<RulesResponse>;
  getChecklist(sessionId: string): Promise<ChecklistResponse>;
  createPacket(
    sessionId: string,
    fields: PacketFieldInput[],
    includedDocuments: string[]
  ): Promise<PacketResponse>;
  downloadPacket(packetId: string): Promise<{ downloadUrl: string }>;
}

export interface RulesQueryInput {
  confirmedIncome: { amount: number; frequency: string } | null;
  metro: string;
  householdSize: number;
  amiPct?: number;
  year?: number;
}

export type PacketFieldInput = Pick<ProfileField, "name" | "value" | "state">;

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
