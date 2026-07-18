import type { ProfileResponse, SessionResponse } from "@/types/domain";

/** Anonymous, short-lived demo session fixture. */
export const sessionMock: SessionResponse = {
  sessionId: "sess_local_demo",
  expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour TTL
};

/** Confirmed-only profile fixture (nothing unconfirmed appears here). */
export const profileMock: ProfileResponse = {
  householdSize: 2,
  confirmedFields: [
    { documentId: "doc_001", name: "employee_name", value: "Maria Santos", state: "confirmed" },
    { documentId: "doc_001", name: "gross_pay", value: 2650, state: "corrected" },
    { documentId: "doc_001", name: "pay_frequency", value: "Monthly", state: "confirmed" },
  ],
};
