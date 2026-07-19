import type {
  ChecklistResponse,
  ExtractionResponse,
  FieldUpdate,
  PacketResponse,
  ProfileResponse,
  RequestedType,
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
  const headers = new Headers(init?.headers);
  const isFormData =
    typeof FormData !== "undefined" && init?.body instanceof FormData;
  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers,
    });
  } catch (cause) {
    throw new ApiError(
      "Could not reach the ProofSetu service. Check your connection and try again."
    );
  }
  if (!res.ok) {
    throw new ApiError(`Request to ${path} failed.`, res.status);
  }
  if (res.status === 204) return undefined as T;
  if (!res.headers.get("content-type")?.includes("application/json")) {
    return undefined as T;
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

  uploadDocument(
    file: File,
    sessionId: string,
    _requestedType: RequestedType = "auto"
  ): Promise<ExtractionResponse> {
    const body = new FormData();
    body.append("file", file);
    body.append("session_id", sessionId);
    return request<ExtractionResponse>("/documents", {
      method: "POST",
      body,
    });
  },

  updateDocumentField(
    documentId: string,
    field: FieldUpdate
  ): Promise<ExtractionResponse | null> {
    const action = field.state === "corrected" ? "correct" : "confirm";
    return request<ExtractionResponse | null>(`/documents/${documentId}/fields`, {
      method: "PATCH",
      body: JSON.stringify({ name: field.name, action, value: field.value }),
    });
  },

  getProfile(sessionId: string): Promise<ProfileResponse> {
    return request<ProfileResponse>(`/profile?session_id=${encodeURIComponent(sessionId)}`);
  },

  queryRules(question: string, context): Promise<RulesResponse> {
    return request<RulesResponse>("/rules/query", {
      method: "POST",
      body: JSON.stringify({ question, ...context }),
    });
  },

  getChecklist(sessionId: string): Promise<ChecklistResponse> {
    return request<ChecklistResponse>(
      `/checklist?program=lihtc&session_id=${encodeURIComponent(sessionId)}`
    );
  },

  createPacket(sessionId, fields, includedDocuments): Promise<PacketResponse> {
    return request<PacketResponse>("/packet", {
      method: "POST",
      body: JSON.stringify({ sessionId, fields, includedDocuments }),
    });
  },

  async downloadPacket(packetId: string) {
    return { downloadUrl: `${BASE_URL}/packet/${packetId}/pdf` };
  },
};
