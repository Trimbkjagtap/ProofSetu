import { Scale } from "lucide-react";
import type { RuleCalculation } from "@/types/domain";
import { formatCurrency } from "@/lib/format";

interface PublishedLimitCardProps {
  calculation: RuleCalculation;
}

/**
 * The published 2026 limit and the difference from the annualized income —
 * presented as neutral figures, never as a pass/fail or eligibility result.
 */
export function PublishedLimitCard({ calculation }: PublishedLimitCardProps) {
  const rows = [
    {
      term: "Annualized income",
      value: formatCurrency(calculation.annualizedIncome),
    },
    {
      term: "Published 2026 limit",
      value: formatCurrency(calculation.threshold),
    },
    {
      term: "Difference",
      value: formatCurrency(calculation.difference),
      hint: "A figure, not a decision.",
    },
  ];

  return (
    <section
      aria-labelledby="limit-heading"
      className="rounded-card border border-t-4 border-line border-t-clay bg-paper p-6 shadow-card"
    >
      <div className="flex items-center gap-2">
        <Scale className="h-5 w-5 text-indigo" aria-hidden="true" />
        <h2 id="limit-heading" className="text-lg">
          The published limit
        </h2>
      </div>

      <dl className="mt-4 divide-y divide-line">
        {rows.map((row) => (
          <div
            key={row.term}
            className="flex items-baseline justify-between gap-4 py-3"
          >
            <dt className="text-muted">
              {row.term}
              {row.hint && (
                <span className="mt-0.5 block text-sm text-muted/80">
                  {row.hint}
                </span>
              )}
            </dt>
            <dd className="shrink-0 text-lg font-semibold tabular-nums text-ink">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
