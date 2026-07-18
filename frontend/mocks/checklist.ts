import type { ChecklistResponse } from "@/types/domain";

/**
 * Readiness checklist fixture. Mirrors `contracts/checklist-response.json` shape.
 * Statuses describe DOCUMENT readiness only — never an applicant score.
 */
export const checklistMock: ChecklistResponse = {
  items: [
    {
      documentType: "pay_stub",
      label: "Recent pay stub",
      required: true,
      status: "present",
      fixHint: "",
    },
    {
      documentType: "government_id",
      label: "Photo identification",
      required: true,
      status: "expired",
      fixHint: "Upload an identification document that has not expired.",
    },
    {
      documentType: "bank_statement",
      label: "Recent bank statement",
      required: true,
      status: "missing",
      fixHint: "Upload your most recent bank statement.",
    },
    {
      documentType: "benefit_letter",
      label: "Benefit letter",
      required: false,
      status: "present",
      fixHint: "",
    },
  ],
};
