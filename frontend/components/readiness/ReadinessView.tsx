"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ClipboardList, Info } from "lucide-react";
import type { ChecklistItem, ChecklistStatus } from "@/types/domain";
import { apiClient } from "@/lib/api/client";
import { useAnnounce } from "@/lib/a11y/AnnouncerContext";
import { ChecklistItem as ChecklistItemRow } from "./ChecklistItem";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";

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
  const { announce } = useAnnounce();
  const [items, setItems] = useState<ChecklistItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.getChecklist();
      setItems(res.items);
      announce("Your document readiness checklist is ready.");
    } catch {
      setError("We couldn’t load your checklist. Please try again.");
      announce("We couldn’t load your checklist.", "assertive");
    } finally {
      setLoading(false);
    }
  }, [announce]);

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
    <div className="space-y-6">
      {/* Non-numeric progress summary (word-based, no score/percentage). */}
      <section
        aria-labelledby="summary-heading"
        className="rounded-card border border-line bg-paper p-6 shadow-card"
      >
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-forest" aria-hidden="true" />
          <h2 id="summary-heading" className="text-lg">
            Where your documents stand
          </h2>
        </div>
        <p className="mt-2 text-ink">
          {attentionCount > 0
            ? `${attentionCount} document${attentionCount === 1 ? "" : "s"} still ${
                attentionCount === 1 ? "needs" : "need"
              } attention.`
            : "Everything on the list is present."}
        </p>
        <ul className="mt-3 flex flex-wrap gap-2" aria-label="Document status summary">
          {summaryCounts.map(({ status, count }) => (
            <li key={status} className="flex items-center gap-2">
              <StatusBadge kind="checklist" status={status} />
              <span className="text-sm text-ink">
                {count} document{count === 1 ? "" : "s"}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 flex items-start gap-2 rounded-card border border-line bg-ivory p-3 text-sm text-muted">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-forest" aria-hidden="true" />
          <span>
            This is a document checklist, <strong>not an eligibility score</strong>.
            It shows which documents are ready — it does not decide whether you
            qualify. A qualified housing professional makes that decision.
          </span>
        </p>
      </section>

      {/* Groups, attention-needed first. */}
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
            <ul className="space-y-3">
              {groupItems.map((item) => (
                <ChecklistItemRow key={item.documentType} item={item} />
              ))}
            </ul>
          </section>
        );
      })}

      <div className="border-t border-line pt-4">
        <Link
          href="/packet"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-card border border-forest bg-forest px-5 py-2.5 font-medium text-paper hover:bg-forest-dark focus-visible:outline-none"
        >
          Continue to packet preview
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
