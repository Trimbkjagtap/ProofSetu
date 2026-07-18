"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FileText,
  Lock,
  UserRound,
  Users,
} from "lucide-react";
import type {
  ChecklistItem,
  DocumentType,
  PacketResponse,
  RulesResponse,
} from "@/types/domain";
import { apiClient } from "@/lib/api/client";
import { useApp } from "@/lib/state/AppContext";
import { useAnnounce } from "@/lib/a11y/AnnouncerContext";
import { humanizeDocumentType } from "@/lib/documents";
import { formatFieldValue, humanizeFieldName } from "@/lib/format";
import { buildMockPacketText, downloadTextFile } from "@/lib/packet";
import { CalculationBreakdown } from "@/components/rules/CalculationBreakdown";
import { CitationCard } from "@/components/rules/CitationCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { DeleteSessionButton } from "@/components/shell/DeleteSessionButton";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";

const OVERVIEW_QUESTION =
  "How is my income annualized against the published 2026 limit?";

interface PacketData {
  packet: PacketResponse;
  rules: RulesResponse;
  attention: ChecklistItem[];
  /** Documents eligible for inclusion (present/ready — never expired or missing). */
  includableDocuments: DocumentType[];
}

/**
 * Loads and presents the review-ready packet: confirmed information, household
 * size, calculation + citation, document selection, and the missing/expired
 * summary. Only confirmed information is ever included.
 */
export function PacketView() {
  const { state, dispatch, confirmedFields } = useApp();
  const { announce } = useAnnounce();
  const [data, setData] = useState<PacketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prepared, setPrepared] = useState(false);

  // Confirmed renter name comes from the shared state, not a hardcoded value.
  const nameField = confirmedFields.find((f) => f.name === "employee_name");
  const renterName = nameField ? String(nameField.value) : "Not provided yet";

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [packet, rules, checklist] = await Promise.all([
        apiClient.createPacket(),
        apiClient.queryRules(OVERVIEW_QUESTION),
        apiClient.getChecklist(),
      ]);
      const attention = checklist.items.filter((i) => i.status !== "present");
      // A document that needs attention (expired/missing/expiring) can't be
      // included, so it never appears in both lists.
      const attentionTypes = new Set(attention.map((i) => i.documentType));
      const includableDocuments = packet.includedDocuments.filter(
        (dt) => !attentionTypes.has(dt)
      );
      setData({ packet, rules, attention, includableDocuments });
      announce("Your packet preview is ready.");
    } catch {
      setError("We couldn’t prepare your packet. Please try again.");
      announce("We couldn’t prepare your packet.", "assertive");
    } finally {
      setLoading(false);
    }
  }, [announce]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleDownload(current: PacketData) {
    announce("Preparing your prototype packet download.");
    // Keep the typed API call so the real backend PDF can replace this later.
    await apiClient.downloadPacket(current.packet.packetId);

    const includedLabels = current.includableDocuments
      .filter((dt) => state.packetSelections[dt] ?? true)
      .map((dt) => humanizeDocumentType(dt));

    const text = buildMockPacketText({
      renterName,
      householdSize: state.householdSize,
      confirmedFields,
      calculation: current.rules.calculation,
      citation: current.rules.citation,
      includedDocuments: includedLabels,
      attention: current.attention.map((a) => ({ label: a.label, status: a.status })),
    });
    downloadTextFile("ProofSetu-prototype-packet.txt", text);

    setPrepared(true);
    announce("Prototype packet downloaded from your confirmed information.");
  }

  if (loading) return <LoadingState label="Preparing your packet…" />;
  if (error || !data) {
    return (
      <ErrorState
        message={error ?? "The packet is unavailable."}
        onRetry={() => void load()}
      />
    );
  }

  const { rules, attention, includableDocuments } = data;

  return (
    <div className="space-y-6">
      {/* Confirmed-only assurance. */}
      <div className="flex items-start gap-2 rounded-card border border-forest/30 bg-sage p-4 text-forest-dark">
        <Lock className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <p className="font-medium">Only information you confirmed will be included.</p>
      </div>

      {/* Confirmed renter information + household size */}
      <section
        aria-labelledby="confirmed-heading"
        className="rounded-card border border-line bg-paper p-6 shadow-card"
      >
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-forest" aria-hidden="true" />
          <h2 id="confirmed-heading" className="text-lg">
            Confirmed information
          </h2>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2 text-ink">
            <UserRound className="h-4 w-4 text-muted" aria-hidden="true" />
            <span className="font-medium">Renter name:</span>
            <span>{renterName}</span>
          </div>
          <div className="flex items-center gap-2 text-ink">
            <Users className="h-4 w-4 text-muted" aria-hidden="true" />
            <span className="font-medium">Household size:</span>
            <span>
              {state.householdSize} {state.householdSize === 1 ? "person" : "people"}
            </span>
          </div>
        </div>

        {confirmedFields.length > 0 ? (
          <dl className="mt-4 divide-y divide-line">
            {confirmedFields.map((f) => (
              <div
                key={`${f.documentId}-${f.name}`}
                className="flex items-center justify-between gap-4 py-2"
              >
                <dt className="text-muted">{humanizeFieldName(f.name)}</dt>
                <dd className="flex items-center gap-2 text-ink">
                  <span className="font-medium">{formatFieldValue(f)}</span>
                  <StatusBadge kind="field" status={f.state} />
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="mt-4 text-muted">
            You haven’t confirmed any document details yet.{" "}
            <Link
              href="/profile"
              className="text-forest underline underline-offset-4 hover:text-forest-dark"
            >
              Go back to your documents
            </Link>{" "}
            to confirm information first.
          </p>
        )}
      </section>

      {/* Calculation + citation */}
      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <CalculationBreakdown calculation={rules.calculation} />
        <CitationCard citation={rules.citation} />
      </div>

      {/* Included documents with include/remove checkboxes */}
      <section
        aria-labelledby="docs-heading"
        className="rounded-card border border-line bg-paper p-6 shadow-card"
      >
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-forest" aria-hidden="true" />
          <h2 id="docs-heading" className="text-lg">
            Documents to include
          </h2>
        </div>
        <p className="mt-1 text-muted">
          Choose which documents go into your packet. Uncheck any you’d rather leave
          out.
        </p>
        {includableDocuments.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {includableDocuments.map((docType: DocumentType) => {
              const included = state.packetSelections[docType] ?? true;
              return (
                <li key={docType}>
                  <label className="flex min-h-[44px] items-center gap-3 rounded-card border border-line px-3 py-2">
                    <input
                      type="checkbox"
                      checked={included}
                      onChange={() => {
                        dispatch({ type: "TOGGLE_PACKET_DOC", documentType: docType });
                        announce(
                          `${humanizeDocumentType(docType)} ${
                            included ? "removed from" : "added to"
                          } your packet.`
                        );
                      }}
                      className="h-5 w-5 shrink-0 accent-forest"
                    />
                    <span className="text-ink">{humanizeDocumentType(docType)}</span>
                    <span className="ml-auto text-sm text-muted">
                      {included ? "Included" : "Not included"}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-4 text-muted">
            No documents are ready to include yet. Add current documents on the
            documents step.
          </p>
        )}
      </section>

      {/* Missing / expired summary */}
      {attention.length > 0 && (
        <section
          aria-labelledby="attention-heading"
          className="rounded-card border border-line bg-paper p-6 shadow-card"
        >
          <h2 id="attention-heading" className="text-lg">
            Not included: documents that need attention
          </h2>
          <p className="mt-1 text-muted">
            These aren’t part of your packet yet. You can add them on the documents
            step.
          </p>
          <ul className="mt-4 space-y-2">
            {attention.map((item) => (
              <li
                key={item.documentType}
                className="flex flex-wrap items-center justify-between gap-2 rounded-card border border-line px-3 py-2"
              >
                <span className="text-ink">{item.label}</span>
                <StatusBadge kind="checklist" status={item.status} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {prepared && (
        <div
          role="status"
          className="flex items-start gap-2 rounded-card border border-forest/30 bg-sage p-4 text-forest-dark"
        >
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <span>
            Prototype download generated from confirmed mock information. The real
            backend PDF will replace this file once connected.
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:flex-wrap sm:items-center">
        <Button variant="primary" onClick={() => void handleDownload(data)}>
          <Download className="h-4 w-4" aria-hidden="true" />
          Download PDF
        </Button>
        <Link
          href="/profile"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-card border border-line bg-paper px-5 py-2.5 font-medium text-forest hover:bg-sage focus-visible:outline-none"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back and edit
        </Link>
        <div className="sm:ml-auto">
          <DeleteSessionButton compact />
        </div>
      </div>

      <p className="text-sm text-muted">
        Prototype download generated from confirmed mock information — not an
        official document.
      </p>
      <p className="text-sm text-muted">
        ProofSetu prepares. You confirm. A qualified housing professional decides.
      </p>
    </div>
  );
}
