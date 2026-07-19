import { BookMarked } from "lucide-react";
import type { RuleCitation } from "@/types/domain";
import { formatDate } from "@/lib/format";

interface CitationCardProps {
  citation: RuleCitation;
}

/**
 * Source citation for the published rule. Uses citation blue as an information
 * accent (not a success color) so it reads as a reference, not a verdict.
 */
export function CitationCard({ citation }: CitationCardProps) {
  const rows = [
    { term: "Source", value: citation.source },
    { term: "Section", value: citation.section },
    { term: "Rule year", value: String(citation.ruleYear) },
    { term: "Effective date", value: formatDate(citation.effectiveDate) },
  ];

  return (
    <aside
      aria-labelledby="citation-heading"
      className="rounded-card border border-t-4 border-line border-t-berry bg-blush p-6 shadow-card"
    >
      <div className="flex items-center gap-2 text-citation">
        <BookMarked className="h-5 w-5" aria-hidden="true" />
        <h2 id="citation-heading" className="text-lg text-citation">
          Where this rule comes from
        </h2>
      </div>

      <dl className="mt-4 space-y-3">
        {rows.map((row) => (
          <div key={row.term} className="flex flex-col sm:flex-row sm:gap-3">
            <dt className="w-40 shrink-0 text-sm font-medium text-muted">
              {row.term}
            </dt>
            <dd className="text-ink">{row.value}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}
