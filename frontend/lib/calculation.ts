import type { ConfirmedProfileField, RuleCalculation } from "@/types/domain";
import { formatCurrency } from "./format";

/**
 * Reads the confirmed/corrected monthly gross pay from shared state.
 * Returns null when income has not been confirmed yet.
 */
export function confirmedGrossPay(fields: ConfirmedProfileField[]): number | null {
  const field = fields.find((f) => f.name === "gross_pay");
  if (!field) return null;
  const value = Number(field.value);
  return Number.isNaN(value) ? null : value;
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
