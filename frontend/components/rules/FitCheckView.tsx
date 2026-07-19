"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Info, RefreshCw } from "lucide-react";
import type { RulesResponse } from "@/types/domain";
import { apiClient } from "@/lib/api/client";
import { useApp } from "@/lib/state/AppContext";
import { useAnnounce } from "@/lib/a11y/AnnouncerContext";
import { buildCalculation, confirmedGrossPay } from "@/lib/calculation";
import { CalculationBreakdown } from "./CalculationBreakdown";
import { PublishedLimitCard } from "./PublishedLimitCard";
import { CitationCard } from "./CitationCard";
import { RulesQuery } from "./RulesQuery";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LinkButton } from "@/components/ui/LinkButton";
import { BottomNav } from "@/components/shell/BottomNav";
import { BackButton } from "@/components/shell/BackButton";

/** A neutral, grounded question used to load the calculation on arrival. */
const OVERVIEW_QUESTION =
  "How is my income annualized against the published 2026 limit?";

/**
 * Loads and presents the deterministic income calculation and its citation as
 * neutral facts, then offers the rule-question input. Shows no verdict anywhere.
 */
export function FitCheckView() {
  const { state, dispatch, confirmedFields } = useApp();
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

  // Derive the calculation from the renter's CONFIRMED income (shared state),
  // using the published threshold from the rule. This keeps Profile, Fit Check,
  // and Packet showing the same numbers.
  const monthlyIncome = confirmedGrossPay(confirmedFields);
  const calculation =
    monthlyIncome === null
      ? null
      : buildCalculation(monthlyIncome, data.calculation.threshold);

  return (
    <div className="space-y-8">
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
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-indigo" aria-hidden="true" />
        <p className="text-ink">{data.answer}</p>
      </div>

      {calculation ? (
        <>
          <CalculationBreakdown calculation={calculation} />
          <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
            <PublishedLimitCard calculation={calculation} />
            <CitationCard citation={data.citation} />
          </div>
        </>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
          <div className="flex items-start gap-3 rounded-card border border-line bg-paper p-6 shadow-card">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-indigo" aria-hidden="true" />
            <p className="text-ink">
              Confirm your income on the{" "}
              <Link
                href="/profile"
                className="text-indigo underline underline-offset-4 hover:text-navy"
              >
                documents step
              </Link>{" "}
              to see the calculation.
            </p>
          </div>
          <CitationCard citation={data.citation} />
        </div>
      )}

      {/* Neutral disclaimer. */}
      <p className="rounded-card border border-line bg-panel-gradient p-4 text-muted">
        {data.disclaimer}
      </p>

      <RulesQuery />

      <BottomNav>
        <BackButton href="/profile" />
        <LinkButton href="/readiness" variant="primary">
          Continue
          <ArrowRight
            className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </LinkButton>
      </BottomNav>
    </div>
  );
}
