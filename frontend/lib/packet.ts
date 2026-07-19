import type { ConfirmedProfileField, RuleCalculation, RuleCitation } from "@/types/domain";
import { formatCurrency, formatDate, formatFieldValue, humanizeFieldName } from "./format";

export interface MockPacketInput {
  renterName: string;
  householdSize: number;
  confirmedFields: ConfirmedProfileField[];
  calculation: RuleCalculation | null;
  citation: RuleCitation | null;
  includedDocuments: string[];
  attention: { label: string; status: string }[];
}

/**
 * Builds a plain-text representation of the packet from confirmed mock data.
 * This is a PROTOTYPE artifact — deliberately not a real PDF or official record.
 */
export function buildMockPacketText(input: MockPacketInput): string {
  const {
    renterName,
    householdSize,
    confirmedFields,
    calculation,
    citation,
    includedDocuments,
    attention,
  } = input;

  const line = "=".repeat(60);
  const rows: string[] = [];

  rows.push(line);
  rows.push("ProofSetu: PROTOTYPE PACKET");
  rows.push("Prototype download generated from confirmed mock information.");
  rows.push("Not an official document. Does not determine eligibility.");
  rows.push(line);
  rows.push("");
  rows.push(`Renter name: ${renterName}`);
  rows.push(`Household size: ${householdSize} ${householdSize === 1 ? "person" : "people"}`);
  rows.push("");
  rows.push("CONFIRMED INFORMATION");
  rows.push("-".repeat(60));
  if (confirmedFields.length === 0) {
    rows.push("(No confirmed fields.)");
  } else {
    for (const f of confirmedFields) {
      rows.push(`${humanizeFieldName(f.name)}: ${formatFieldValue(f)} (${f.state})`);
    }
  }
  rows.push("");
  if (calculation) {
    rows.push("INCOME AND THE PUBLISHED LIMIT");
    rows.push("-".repeat(60));
    rows.push(`Confirmed monthly income: ${formatCurrency(calculation.confirmedValue)}`);
    rows.push(`Calculation: ${calculation.formula}`);
    rows.push(`Annualized income: ${formatCurrency(calculation.annualizedIncome)}`);
    rows.push(`Published 2026 limit: ${formatCurrency(calculation.threshold)}`);
    rows.push(`Difference: ${formatCurrency(calculation.difference)}`);
    rows.push("This comparison does not determine eligibility.");
    rows.push("");
  }
  if (citation) {
    rows.push("CITATION");
    rows.push("-".repeat(60));
    rows.push(`Source: ${citation.source}`);
    rows.push(`Section: ${citation.section}`);
    rows.push(`Rule year: ${citation.ruleYear}`);
    rows.push(`Effective date: ${formatDate(citation.effectiveDate)}`);
  }
  rows.push("");
  rows.push("INCLUDED DOCUMENTS");
  rows.push("-".repeat(60));
  rows.push(includedDocuments.length ? includedDocuments.join("\n") : "(None selected.)");
  rows.push("");
  rows.push("DOCUMENTS NEEDING ATTENTION (NOT INCLUDED)");
  rows.push("-".repeat(60));
  rows.push(
    attention.length
      ? attention.map((a) => `${a.label}: ${a.status}`).join("\n")
      : "(None.)"
  );
  rows.push("");
  rows.push(line);
  rows.push("ProofSetu prepares. You confirm. A qualified housing professional decides.");
  rows.push(line);

  return rows.join("\n");
}

/** Triggers a browser download of text content. Safe, fully client-side. */
export function downloadTextFile(filename: string, text: string): void {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
