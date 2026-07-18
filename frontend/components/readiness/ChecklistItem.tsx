"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { ChecklistItem as ChecklistItemType, ChecklistStatus } from "@/types/domain";
import { StatusBadge } from "@/components/ui/StatusBadge";

/** Plain-language explanation for each document status. */
const EXPLANATIONS: Record<ChecklistStatus, string> = {
  present: "This document is on file and current.",
  missing: "We don’t have this document yet.",
  expiring: "This document is on file but will expire soon.",
  expired: "This document is on file, but it has expired.",
};

interface ChecklistItemProps {
  item: ChecklistItemType;
}

/**
 * A single readiness row: label, status (icon + word), explanation, and — when
 * something needs attention — a fix instruction and a "Fix this" link to Profile.
 */
export function ChecklistItem({ item }: ChecklistItemProps) {
  const needsFix = item.status !== "present";

  return (
    <li className="rounded-card border border-line bg-paper p-4 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-serif text-base font-semibold text-forest-dark">
              {item.label}
            </h3>
            <span
              className={[
                "rounded-full border px-2 py-0.5 text-xs font-medium uppercase tracking-wide",
                item.required
                  ? "border-line text-muted"
                  : "border-line bg-ivory text-muted",
              ].join(" ")}
            >
              {item.required ? "Required" : "Optional"}
            </span>
          </div>
          <p className="mt-1 text-muted">{EXPLANATIONS[item.status]}</p>
          {needsFix && item.fixHint && (
            <p className="mt-2 text-ink">
              <span className="font-medium">What to do: </span>
              {item.fixHint}
            </p>
          )}
        </div>

        <StatusBadge kind="checklist" status={item.status} />
      </div>

      {needsFix ? (
        <div className="mt-3">
          <Link
            href="/profile"
            aria-label={`Fix ${item.label} on the documents step`}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-card border border-forest px-4 py-2 text-sm font-medium text-forest hover:bg-sage focus-visible:outline-none"
          >
            Fix this
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted">No action needed.</p>
      )}
    </li>
  );
}
