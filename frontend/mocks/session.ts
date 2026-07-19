import type { ProfileResponse, SessionResponse } from "@/types/domain";

/** Anonymous, short-lived demo session fixture. */
export const sessionMock: SessionResponse = {
  sessionId: "sess_local_demo",
  expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour TTL
  ttlSeconds: 60 * 60,
};

/** Confirmed-only profile fixture (nothing unconfirmed appears here). */
export const profileMock: ProfileResponse = {
  sessionId: "sess_local_demo",
  confirmedFieldsOnly: true,
  fields: [
    { name: "employee_name", value: "Maria Santos", state: "confirmed" },
    { name: "gross_pay", value: 2650, state: "corrected" },
    { name: "pay_frequency", value: "Monthly", state: "confirmed" },
  ],
};
