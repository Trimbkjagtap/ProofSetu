import { Calculator } from "lucide-react";
import type { RuleCalculation } from "@/types/domain";
import { formatCurrency } from "@/lib/format";

interface CalculationBreakdownProps {
  calculation: RuleCalculation;
}

function Chip({
  main,
  sub,
  highlight = false,
}: {
  main: string;
  sub: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={[
        "flex min-w-[110px] flex-1 flex-col items-center rounded-card border px-4 py-3 text-center",
        highlight
          ? "border-transparent bg-primary-gradient text-white shadow-card"
          : "border-line bg-white",
      ].join(" ")}
    >
      <span className="text-xl font-semibold tabular-nums">{main}</span>
      <span className={highlight ? "text-sm text-white/80" : "text-sm text-muted"}>
        {sub}
      </span>
    </div>
  );
}

function Operator({ symbol }: { symbol: string }) {
  return (
    <span
      aria-hidden="true"
      className="flex shrink-0 items-center text-xl font-semibold text-muted"
    >
      {symbol}
    </span>
  );
}

/**
 * Horizontal visual calculation strip:
 *   $2,650 monthly × 12 months = $31,800 annually
 * Neutral facts only — no approval, rejection, score, or eligibility result.
 */
export function CalculationBreakdown({ calculation }: CalculationBreakdownProps) {
  const months = Math.round(
    calculation.annualizedIncome / calculation.confirmedValue
  );

  return (
    <section
      aria-labelledby="calc-heading"
      className="rounded-card border border-t-4 border-line border-t-apricot bg-paper p-6 shadow-card"
    >
      <div className="flex items-center gap-2">
        <Calculator className="h-5 w-5 text-indigo" aria-hidden="true" />
        <h2 id="calc-heading" className="text-lg">
          How the numbers were calculated
        </h2>
      </div>

      <p className="sr-only">
        {formatCurrency(calculation.confirmedValue)} monthly times {months} months
        equals {formatCurrency(calculation.annualizedIncome)} annually.
      </p>

      <div className="mt-4 flex flex-wrap items-stretch gap-3">
        <Chip main={formatCurrency(calculation.confirmedValue)} sub="monthly" />
        <Operator symbol="×" />
        <Chip main={String(months)} sub="months" />
        <Operator symbol="=" />
        <Chip
          main={formatCurrency(calculation.annualizedIncome)}
          sub="annually"
          highlight
        />
      </div>

      <p className="mt-4 text-sm text-muted">
        This uses the income you confirmed and the published annualization rule.
      </p>
    </section>
  );
}
