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
import type { ProofSetuApi } from "./types";
import { mockExtractionFor } from "@/mocks/extractionByType";
import { rulesMock, rulesRefusalMock } from "@/mocks/rules";
import { checklistMock } from "@/mocks/checklist";
import { packetMock } from "@/mocks/packet";
import { profileMock, sessionMock } from "@/mocks/session";

/** Small artificial delay so loading and live-region states are demonstrable. */
function delay<T>(value: T, ms = 500): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

/** Words that signal an eligibility-verdict question → safe refusal. */
const VERDICT_TERMS = [
  "eligible",
  "eligibility",
  "qualify",
  "qualified",
  "approved",
  "approve",
  "denied",
  "deny",
  "pass",
  "fail",
];

function isVerdictQuestion(question: string): boolean {
  const q = question.toLowerCase();
  return VERDICT_TERMS.some((term) => q.includes(term));
}

/**
 * Mock implementation — returns bundled fixtures. Used when
 * NEXT_PUBLIC_USE_MOCKS=true, and as the graceful fallback for the demo.
 */
export const mockClient: ProofSetuApi = {
  createSession() {
    return delay(sessionMock);
  },

  deleteSession(_sessionId: string) {
    return delay({ deleted: true as const });
  },

  uploadDocument(
    _file: File,
    requestedType: RequestedType = "auto"
  ): Promise<ExtractionResponse> {
    const id = `doc_${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;
    return delay(mockExtractionFor(requestedType, id), 900);
  },

  updateDocumentField(
    documentId: string,
    field: FieldUpdate
  ): Promise<ExtractionResponse> {
    // Echo the update back into a pay-stub-shaped response (field patched).
    const base = mockExtractionFor("pay_stub", documentId);
    return delay(
      {
        ...base,
        fields: base.fields.map((f) =>
          f.name === field.name
            ? { ...f, value: field.value, state: field.state }
            : f
        ),
      },
      350
    );
  },

  getProfile(): Promise<ProfileResponse> {
    return delay(profileMock);
  },

  queryRules(question: string): Promise<RulesResponse> {
    return delay(isVerdictQuestion(question) ? rulesRefusalMock : rulesMock, 700);
  },

  getChecklist(): Promise<ChecklistResponse> {
    return delay(checklistMock);
  },

  createPacket(): Promise<PacketResponse> {
    return delay(packetMock, 700);
  },

  downloadPacket(packetId: string): Promise<{ downloadUrl: string }> {
    return delay({ downloadUrl: `/packet/${packetId}/pdf` });
  },
};
