import { Calculator } from "lucide-react";
import type { RuleCalculation } from "@/types/domain";
import { formatCurrency } from "@/lib/format";

interface CalculationBreakdownProps {
  calculation: RuleCalculation;
}

interface Row {
  term: string;
  value: string;
  hint?: string;
  /** Visually emphasize a headline figure — with weight, never a success color. */
  emphasize?: boolean;
}

/**
 * Deterministic income calculation, presented as neutral facts. Intentionally
 * avoids green/red or any pass/fail framing — it states figures, not a verdict.
 */
export function CalculationBreakdown({ calculation }: CalculationBreakdownProps) {
  const rows: Row[] = [
    {
      term: "Your confirmed monthly income",
      value: formatCurrency(calculation.confirmedValue),
      hint: "The value you confirmed on the previous step.",
    },
    {
      term: "Calculation",
      value: calculation.formula,
      hint: "Monthly income annualized using the published program rule.",
    },
    {
      term: "Annualized income",
      value: formatCurrency(calculation.annualizedIncome),
      emphasize: true,
    },
    {
      term: "Published 2026 limit",
      value: formatCurrency(calculation.threshold),
      emphasize: true,
    },
    {
      term: "Difference",
      value: formatCurrency(calculation.difference),
      hint: "The gap between the annualized income and the published limit. This is a figure, not a decision.",
    },
  ];

  return (
    <section
      aria-labelledby="calc-heading"
      className="rounded-card border border-line bg-paper p-6 shadow-card"
    >
      <div className="flex items-center gap-2">
        <Calculator className="h-5 w-5 text-forest" aria-hidden="true" />
        <h2 id="calc-heading" className="text-lg">
          Income and the published limit
        </h2>
      </div>

      <dl className="mt-4 divide-y divide-line">
        {rows.map((row) => (
          <div
            key={row.term}
            className="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
          >
            <dt className="text-muted">
              {row.term}
              {row.hint && (
                <span className="mt-0.5 block text-sm text-muted/80">
                  {row.hint}
                </span>
              )}
            </dt>
            <dd
              className={[
                "shrink-0 tabular-nums text-ink",
                row.emphasize ? "text-2xl font-semibold" : "text-lg font-medium",
              ].join(" ")}
            >
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
