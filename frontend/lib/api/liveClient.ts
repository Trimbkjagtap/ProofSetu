import type {
  ChecklistResponse,
  ExtractionResponse,
  FieldUpdate,
  PacketResponse,
  ProfileResponse,
  RulesResponse,
  SessionResponse,
} from "@/types/domain";
import { ApiError, type ProofSetuApi } from "./types";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:8000";

async function request<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
      ...init,
    });
  } catch (cause) {
    throw new ApiError(
      "Could not reach the ProofSetu service. Check your connection and try again."
    );
  }
  if (!res.ok) {
    throw new ApiError(`Request to ${path} failed.`, res.status);
  }
  return (await res.json()) as T;
}

/**
 * Live implementation — talks to the FastAPI backend. Endpoints follow
 * OWNERSHIP.md core API. Selected when NEXT_PUBLIC_USE_MOCKS is not "true".
 */
export const liveClient: ProofSetuApi = {
  createSession() {
    return request<SessionResponse>("/session", { method: "POST" });
  },

  async deleteSession(sessionId: string) {
    await request<unknown>(`/session/${sessionId}`, { method: "DELETE" });
    return { deleted: true as const };
  },

  uploadDocument(file: File): Promise<ExtractionResponse> {
    const body = new FormData();
    body.append("file", file);
    // Let the browser set the multipart boundary; drop the JSON header.
    return request<ExtractionResponse>("/documents", {
      method: "POST",
      body,
      headers: {},
    });
  },

  updateDocumentField(
    documentId: string,
    field: FieldUpdate
  ): Promise<ExtractionResponse> {
    return request<ExtractionResponse>(`/documents/${documentId}/fields`, {
      method: "PATCH",
      body: JSON.stringify(field),
    });
  },

  getProfile(): Promise<ProfileResponse> {
    return request<ProfileResponse>("/profile");
  },

  queryRules(question: string): Promise<RulesResponse> {
    return request<RulesResponse>("/rules/query", {
      method: "POST",
      body: JSON.stringify({ question }),
    });
  },

  getChecklist(): Promise<ChecklistResponse> {
    return request<ChecklistResponse>("/checklist?program=lihtc");
  },

  createPacket(): Promise<PacketResponse> {
    return request<PacketResponse>("/packet", { method: "POST" });
  },

  async downloadPacket(packetId: string) {
    return { downloadUrl: `${BASE_URL}/packet/${packetId}/pdf` };
  },
};
