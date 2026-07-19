import type { RulesResponse } from "@/types/domain";

/**
 * Rules-query fixture. Mirrors `contracts/rules-response.json`.
 * Reflects the CORRECTED monthly income of $2,650 (renter changed it from $2,450).
 * This is a neutral comparison — never an eligibility verdict.
 */
export const rulesMock: RulesResponse = {
  answer: "Monthly gross income is annualized using the frozen program rule.",
  calculation: {
    confirmedValue: 2650,
    formula: "$2,650 × 12",
    annualizedIncome: 31800,
    threshold: 46700,
    difference: 14900,
  },
  citation: {
    source: "2026 LIHTC Program Rule Corpus",
    effectiveDate: "2026-05-01",
    ruleYear: 2026,
    section: "Income annualization",
  },
  abstained: false,
  disclaimer: "This comparison does not determine eligibility.",
};

/**
 * Safe refusal fixture — returned when the renter asks a verdict question
 * such as "Am I eligible?". ProofSetu declines and points to a human decider.
 */
export const rulesRefusalMock: RulesResponse = {
  answer:
    "ProofSetu cannot determine eligibility. It can show your confirmed information, the published rule, and the calculation. A qualified housing professional makes the final decision.",
  calculation: null,
  citation: null,
  abstained: true,
  disclaimer: "This comparison does not determine eligibility.",
};
