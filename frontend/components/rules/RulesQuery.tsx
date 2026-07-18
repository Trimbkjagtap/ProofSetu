"use client";

import { useId, useState } from "react";
import { MessagesSquare, Search, ShieldQuestion, Info } from "lucide-react";
import type { RulesResponse } from "@/types/domain";
import { apiClient } from "@/lib/api/client";
import { useAnnounce } from "@/lib/a11y/AnnouncerContext";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/LoadingState";

/**
 * Question input for the published rule. Grounded questions return a neutral
 * explanation; verdict questions ("Am I eligible?") return the safe refusal.
 * The response never contains a decision.
 */
export function RulesQuery() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RulesResponse | null>(null);
  const inputId = useId();
  const { announce } = useAnnounce();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setResult(null);
    announce("Looking up the published rule.");
    try {
      const res = await apiClient.queryRules(trimmed);
      setResult(res);
      announce(res.answer, res.abstained ? "assertive" : "polite");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      aria-labelledby="ask-heading"
      className="rounded-card border border-line bg-paper p-6 shadow-card"
    >
      <div className="flex items-center gap-2">
        <MessagesSquare className="h-5 w-5 text-forest" aria-hidden="true" />
        <h2 id="ask-heading" className="text-lg">
          Have a question about this calculation?
        </h2>
      </div>
      <p className="mt-1 text-muted">
        We can explain the rule and the math behind it. The final decision is always
        made by a housing professional.
      </p>

      <form onSubmit={handleSubmit} className="mt-4">
        <label htmlFor={inputId} className="block text-sm font-medium text-ink">
          Your question
        </label>
        <div className="mt-1 flex flex-col gap-2 sm:flex-row">
          <input
            id={inputId}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. How is my income annualized?"
            className="min-h-[44px] w-full rounded-card border border-line bg-white px-3 py-2 text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-citation"
          />
          <Button type="submit" variant="primary" disabled={loading || !question.trim()}>
            <Search className="h-4 w-4" aria-hidden="true" />
            Ask
          </Button>
        </div>
      </form>

      <div className="mt-4" aria-live="polite">
        {loading && <LoadingState label="Looking up the published rule…" />}

        {!loading && result && (
          <div
            className={[
              "rounded-card border p-4",
              result.abstained
                ? "border-citation/40 bg-citation/5"
                : "border-line bg-ivory",
            ].join(" ")}
          >
            <div className="flex items-start gap-3">
              {result.abstained ? (
                <ShieldQuestion
                  className="mt-0.5 h-5 w-5 shrink-0 text-citation"
                  aria-hidden="true"
                />
              ) : (
                <Info
                  className="mt-0.5 h-5 w-5 shrink-0 text-forest"
                  aria-hidden="true"
                />
              )}
              <div>
                <p className="text-ink">{result.answer}</p>
                <p className="mt-2 text-sm text-muted">{result.disclaimer}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
