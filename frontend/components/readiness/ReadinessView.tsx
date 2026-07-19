"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, ClipboardList, Info } from "lucide-react";
import type { ChecklistItem, ChecklistStatus } from "@/types/domain";
import { apiClient } from "@/lib/api/client";
import { useApp } from "@/lib/state/AppContext";
import { useAnnounce } from "@/lib/a11y/AnnouncerContext";
import { ChecklistItem as ChecklistItemRow } from "./ChecklistItem";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LinkButton } from "@/components/ui/LinkButton";
import { BottomNav } from "@/components/shell/BottomNav";
import { BackButton } from "@/components/shell/BackButton";

/** Order in which status groups are shown: things needing attention first. */
const GROUP_ORDER: { status: ChecklistStatus; heading: string }[] = [
  { status: "expired", heading: "Expired" },
  { status: "missing", heading: "Missing" },
  { status: "expiring", heading: "Expiring soon" },
  { status: "present", heading: "Present" },
];

/**
 * Loads and presents the document readiness checklist. Readiness describes
 * DOCUMENTS, never the applicant — there is no score or percentage here.
 */
export function ReadinessView() {
  const { state } = useApp();
  const { announce } = useAnnounce();
  const [items, setItems] = useState<ChecklistItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const sessionId = state.session?.sessionId;
      if (!sessionId) throw new Error("Your session is not available. Please start again.");
      const res = await apiClient.getChecklist(sessionId);
      setItems(res.items);
      announce("Your document readiness checklist is ready.");
    } catch {
      setError("We couldn’t load your checklist. Please try again.");
      announce("We couldn’t load your checklist.", "assertive");
    } finally {
      setLoading(false);
    }
  }, [announce, state.session?.sessionId]);

  useEffect(() => {
    void load();
  }, [load]);

  const grouped = useMemo(() => {
    const map = new Map<ChecklistStatus, ChecklistItem[]>();
    for (const item of items ?? []) {
      const list = map.get(item.status) ?? [];
      list.push(item);
      map.set(item.status, list);
    }
    return map;
  }, [items]);

  if (loading) return <LoadingState label="Checking your documents…" />;
  if (error || !items) {
    return (
      <ErrorState
        message={error ?? "The checklist is unavailable."}
        onRetry={() => void load()}
      />
    );
  }

  const total = items.length;
  const presentCount = items.filter((i) => i.status === "present").length;
  const attentionCount = total - presentCount;

  // Per-status counts for the word-based summary (no score / percentage).
  const summaryCounts = GROUP_ORDER.map(({ status }) => ({
    status,
    count: items.filter((i) => i.status === status).length,
  })).filter((c) => c.count > 0);

  return (
    <div className="space-y-8">
      {/* Compact status summary. */}
      <section
        aria-labelledby="summary-heading"
        className="rounded-card border border-line bg-panel-gradient p-4 shadow-card"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-indigo" aria-hidden="true" />
            <h2 id="summary-heading" className="text-base font-semibold text-navy">
              {attentionCount > 0
                ? `${attentionCount} document${attentionCount === 1 ? "" : "s"} need attention`
                : "Everything on the list is present"}
            </h2>
          </div>
          <ul className="flex flex-wrap gap-2" aria-label="Document status summary">
            {summaryCounts.map(({ status, count }) => (
              <li key={status} className="flex items-center gap-1.5">
                <StatusBadge kind="checklist" status={status} />
                <span className="text-sm text-ink">{count}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-3 flex items-start gap-2 text-sm text-muted">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-indigo" aria-hidden="true" />
          <span>
            This is a document checklist, <strong>not an eligibility score</strong>.
            A housing professional makes the final decision.
          </span>
        </p>
      </section>

      {/* Groups, attention-needed first, in a responsive two-column grid. */}
      {GROUP_ORDER.map(({ status, heading }) => {
        const groupItems = grouped.get(status);
        if (!groupItems || groupItems.length === 0) return null;
        return (
          <section key={status} aria-labelledby={`group-${status}`}>
            <h2 id={`group-${status}`} className="mb-3 text-lg">
              {heading}{" "}
              <span className="text-base font-normal text-muted">
                ({groupItems.length})
              </span>
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {groupItems.map((item) => (
                <ChecklistItemRow key={item.documentType} item={item} />
              ))}
            </ul>
          </section>
        );
      })}

      <BottomNav>
        <BackButton href="/fit-check" />
        <LinkButton href="/packet" variant="primary">
          Review packet
          <ArrowRight
            className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </LinkButton>
      </BottomNav>
    </div>
  );
}
