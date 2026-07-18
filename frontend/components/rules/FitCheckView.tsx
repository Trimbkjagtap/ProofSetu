"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Info, RefreshCw } from "lucide-react";
import type { RulesResponse } from "@/types/domain";
import { apiClient } from "@/lib/api/client";
import { useApp } from "@/lib/state/AppContext";
import { useAnnounce } from "@/lib/a11y/AnnouncerContext";
import { CalculationBreakdown } from "./CalculationBreakdown";
import { CitationCard } from "./CitationCard";
import { RulesQuery } from "./RulesQuery";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";

/** A neutral, grounded question used to load the calculation on arrival. */
const OVERVIEW_QUESTION =
  "How is my income annualized against the published 2026 limit?";

/**
 * Loads and presents the deterministic income calculation and its citation as
 * neutral facts, then offers the rule-question input. Shows no verdict anywhere.
 */
export function FitCheckView() {
  const { state, dispatch } = useApp();
  const { announce } = useAnnounce();
  const [data, setData] = useState<RulesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Whether this load followed a correction (to show the "updated" note once).
  const followedCorrection = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    followedCorrection.current = state.calculationStale;
    try {
      const res = await apiClient.queryRules(OVERVIEW_QUESTION);
      setData(res);
      if (state.calculationStale) {
        dispatch({ type: "SET_CALCULATION_STALE", stale: false });
      }
      announce("The income calculation is ready.");
    } catch {
      setError("We couldn’t load the calculation. Please try again.");
      announce("We couldn’t load the calculation.", "assertive");
    } finally {
      setLoading(false);
    }
    // Run once on mount; state.calculationStale is read as a snapshot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [announce, dispatch]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <LoadingState label="Preparing your income calculation…" />;
  }

  if (error || !data) {
    return (
      <ErrorState
        message={error ?? "The calculation is unavailable."}
        onRetry={() => void load()}
      />
    );
  }

  return (
    <div className="space-y-6">
      {followedCorrection.current && (
        <div
          role="status"
          className="flex items-start gap-2 rounded-card border border-line bg-sage/60 p-3 text-sm text-forest-dark"
        >
          <RefreshCw className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Updated using the income you confirmed on the previous step.</span>
        </div>
      )}

      {/* Grounded explanation (neutral). */}
      <div className="flex items-start gap-3 rounded-card border border-line bg-paper p-4 shadow-card">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-forest" aria-hidden="true" />
        <p className="text-ink">{data.answer}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <CalculationBreakdown calculation={data.calculation} />
        <CitationCard citation={data.citation} />
      </div>

      {/* Neutral disclaimer. */}
      <p className="rounded-card border border-line bg-ivory p-4 text-muted">
        {data.disclaimer} ProofSetu prepares. You confirm. A qualified housing
        professional decides.
      </p>

      <RulesQuery />

      <div className="border-t border-line pt-4">
        <Link
          href="/readiness"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-card border border-forest bg-forest px-5 py-2.5 font-medium text-paper hover:bg-forest-dark focus-visible:outline-none"
        >
          Continue to document readiness
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
