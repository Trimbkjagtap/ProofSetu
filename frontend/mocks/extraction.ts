import type { ExtractionResponse } from "@/types/domain";

/**
 * Synthetic pay-stub extraction fixture. Mirrors `contracts/extraction-response.json`
 * (a superset with the same property names). Synthetic data only — never real PII.
 */
export const extractionMock: ExtractionResponse = {
  documentId: "doc_001",
  documentType: "pay_stub",
  status: "needs_confirmation",
  fields: [
    {
      name: "employee_name",
      value: "Maria Santos",
      confidence: 0.97,
      state: "unconfirmed",
      sourceBox: { page: 1, x: 110, y: 145, width: 190, height: 34 },
    },
    {
      name: "gross_pay",
      value: 2450,
      confidence: 0.82,
      state: "unconfirmed",
      sourceBox: { page: 1, x: 410, y: 520, width: 150, height: 35 },
    },
    {
      name: "pay_frequency",
      value: "Monthly",
      confidence: 0.91,
      state: "unconfirmed",
      sourceBox: { page: 1, x: 390, y: 560, width: 170, height: 32 },
    },
  ],
};
