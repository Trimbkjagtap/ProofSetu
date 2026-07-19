import type { ConfirmedProfileField, RuleCalculation } from "@/types/domain";
import type { RulesQueryInput } from "@/lib/api/types";
import { formatCurrency } from "./format";

/**
 * Reads the confirmed/corrected monthly gross pay from shared state.
 * Returns null when income has not been confirmed yet.
 */
export function confirmedGrossPay(
  fields: ReadonlyArray<Pick<ConfirmedProfileField, "name" | "value">>
): number | null {
  const field = fields.find((f) => f.name === "gross_pay");
  if (!field) return null;
  const value = Number(field.value);
  return Number.isNaN(value) ? null : value;
}

/** Builds the backend rules context from confirmed profile values and local household size. */
export function buildRulesQueryContext(
  fields: ReadonlyArray<Pick<ConfirmedProfileField, "name" | "value">>,
  householdSize: number
): RulesQueryInput {
  const amount = confirmedGrossPay(fields);
  const frequencyField = fields.find((field) => field.name === "pay_frequency");
  const frequency = frequencyField ? String(frequencyField.value).trim().toLowerCase() : "";

  return {
    confirmedIncome:
      amount !== null && frequency ? { amount, frequency } : null,
    metro: "cambridge_boston",
    householdSize,
    amiPct: 50,
    year: 2026,
  };
}

/**
 * Deterministic income calculation derived from the renter's confirmed monthly
 * income and the published threshold. Using the same source everywhere keeps
 * Profile, Fit Check, and Packet consistent (e.g. $2,650 × 12 = $31,800).
 * This is arithmetic for display only — never an eligibility decision.
 */
export function buildCalculation(
  monthlyIncome: number,
  threshold: number
): RuleCalculation {
  const annualizedIncome = monthlyIncome * 12;
  return {
    confirmedValue: monthlyIncome,
    formula: `${formatCurrency(monthlyIncome)} × 12`,
    annualizedIncome,
    threshold,
    difference: threshold - annualizedIncome,
  };
}
