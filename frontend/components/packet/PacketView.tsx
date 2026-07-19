"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Download,
  FileText,
  PackageCheck,
  UserRound,
  Users,
} from "lucide-react";
import type {
  ChecklistItem,
  DocumentRecord,
  PacketResponse,
  RulesResponse,
} from "@/types/domain";
import { apiClient, IS_MOCK } from "@/lib/api/client";
import { useApp } from "@/lib/state/AppContext";
import { useAnnounce } from "@/lib/a11y/AnnouncerContext";
import { humanizeDocumentType } from "@/lib/documents";
import { formatFieldValue, humanizeFieldName } from "@/lib/format";
import {
  buildCalculation,
  buildRulesQueryContext,
  confirmedGrossPay,
} from "@/lib/calculation";
import { buildMockPacketText, downloadTextFile } from "@/lib/packet";
import { isDocumentSettled } from "@/lib/reviewStatus";
import { CalculationBreakdown } from "@/components/rules/CalculationBreakdown";
import { CitationCard } from "@/components/rules/CitationCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { DeleteSessionButton } from "@/components/shell/DeleteSessionButton";
import { BottomNav } from "@/components/shell/BottomNav";
import { BackButton } from "@/components/shell/BackButton";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";

const OVERVIEW_QUESTION =
  "How is my income annualized against the published 2026 limit?";

interface PacketData {
  packet: PacketResponse;
  rules: RulesResponse;
  attention: ChecklistItem[];
  includableDocuments: DocumentRecord[];
}

export function PacketView() {
  const { state, dispatch, confirmedFields } = useApp();
  const { announce } = useAnnounce();
  const [data, setData] = useState<PacketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prepared, setPrepared] = useState(false);

  const NAME_FIELDS = [
    "employee_name",
    "full_name",
    "recipient_name",
    "account_holder",
  ];
  const nameField = confirmedFields.find((field) => NAME_FIELDS.includes(field.name));
  const renterName = nameField ? String(nameField.value) : "Not provided yet";

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const sessionId = state.session?.sessionId;
      if (!sessionId) throw new Error("Your session is not available. Please start again.");
      const readyDocuments = Object.values(state.documents).filter(
        (doc) => !doc.error && isDocumentSettled(doc)
      );
      const selectedDocuments = readyDocuments;
      const selectedFields = confirmedFields.filter((field) =>
        selectedDocuments.some((doc) => doc.documentId === field.documentId)
      );
      const [packet, rules, checklist] = await Promise.all([
        apiClient.createPacket(
          sessionId,
          selectedFields.map(({ name, value, state: fieldState }) => ({
            name,
            value,
            state: fieldState,
          })),
          selectedDocuments.map((doc) => doc.backendDocumentId ?? doc.documentId)
        ),
        apiClient.queryRules(
          OVERVIEW_QUESTION,
          buildRulesQueryContext(confirmedFields, state.householdSize)
        ),
        apiClient.getChecklist(sessionId),
      ]);
      const attention = checklist.items.filter((item) => item.status !== "present");
      setData({ packet, rules, attention, includableDocuments: readyDocuments });
      announce("Your packet preview is ready.");
    } catch {
      setError("We couldn’t prepare your packet. Please try again.");
      announce("We couldn’t prepare your packet.", "assertive");
    } finally {
      setLoading(false);
    }
  }, [announce, confirmedFields, state.documents, state.householdSize, state.session?.sessionId]);

  useEffect(() => {
    void load();
  }, [load]);

  const includableDocuments = useMemo(
    () => data?.includableDocuments ?? [],
    [data]
  );

  const selectedDocumentIds = useMemo(
    () =>
      new Set(
        includableDocuments
          .filter((doc) => state.packetSelections[doc.documentId] ?? true)
          .map((doc) => doc.documentId)
      ),
    [includableDocuments, state.packetSelections]
  );

  const selectedConfirmedFields = useMemo(
    () => confirmedFields.filter((field) => selectedDocumentIds.has(field.documentId)),
    [confirmedFields, selectedDocumentIds]
  );

  const conflictingFields = useMemo(
    () =>
      Object.entries(
        selectedConfirmedFields.reduce<Record<string, Set<string>>>((acc, field) => {
          acc[field.name] ??= new Set<string>();
          acc[field.name].add(String(field.value).trim().toLowerCase());
          return acc;
        }, {})
      )
        .filter(([, values]) => values.size > 1)
        .map(([name]) => humanizeFieldName(name)),
    [selectedConfirmedFields]
  );

  async function handleDownload(current: PacketData) {
    const includedDocs = current.includableDocuments.filter((doc) =>
      selectedDocumentIds.has(doc.documentId)
    );
    const sessionId = state.session?.sessionId;
    if (!sessionId) {
      announce("Your session is not available. Please start again.", "assertive");
      return;
    }
    let packet: PacketResponse;
    try {
      packet = await apiClient.createPacket(
        sessionId,
        selectedConfirmedFields.map(({ name, value, state: fieldState }) => ({
          name,
          value,
          state: fieldState,
        })),
        includedDocs.map((doc) => doc.backendDocumentId ?? doc.documentId)
      );
      if (!IS_MOCK && packet.packetId) {
        const { downloadUrl } = await apiClient.downloadPacket(packet.packetId);
        // Actually trigger the browser download of the real PDF. The backend
        // serves it with Content-Disposition: attachment, so a transient anchor
        // downloads it without navigating the app away.
        const anchor = document.createElement("a");
        anchor.href = downloadUrl;
        anchor.target = "_blank";
        anchor.rel = "noopener";
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
      }
    } catch {
      announce("We couldn’t prepare your packet. Please try again.", "assertive");
      return;
    }
    announce(IS_MOCK ? "Preparing your prototype packet download." : "Your packet is ready.");
    const includedLabels = includedDocs.map(
      (doc) =>
        `${humanizeDocumentType(doc.documentType)} · ${doc.fileName} · ${doc.source === "scan" ? "Scanned" : "Uploaded"}`
    );

    const monthly = confirmedGrossPay(selectedConfirmedFields);
    const calculation =
      monthly === null || current.rules.calculation === null
        ? null
        : buildCalculation(monthly, current.rules.calculation.threshold);

    const text = buildMockPacketText({
      renterName,
      householdSize: state.householdSize,
      confirmedFields: selectedConfirmedFields,
      calculation,
      citation: current.rules.citation,
      includedDocuments: includedLabels,
      attention: current.attention.map((item) => ({
        label: item.label,
        status: item.status,
      })),
    });
    if (IS_MOCK) downloadTextFile("ProofSetu-prototype-packet.txt", text);

    setPrepared(true);
    announce(
      IS_MOCK
        ? "Prototype packet downloaded from your confirmed information."
        : "Packet prepared from your confirmed information."
    );
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

  const { rules, attention } = data;
  const monthlyIncome = confirmedGrossPay(selectedConfirmedFields);
  const calculation =
    monthlyIncome === null || rules.calculation === null
      ? null
      : buildCalculation(monthlyIncome, rules.calculation.threshold);

  return (
    <div className="space-y-8">
      <div className="overflow-hidden rounded-card bg-primary-gradient p-6 text-white shadow-raised">
        <div className="flex items-start gap-3">
          <PackageCheck className="mt-0.5 h-7 w-7 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-serif text-xl font-semibold">
              Everything you confirmed is here
            </p>
            <p className="mt-1 text-white/85">
              Review it once more, then download your packet when you’re ready.
            </p>
          </div>
        </div>
      </div>

      <section
        aria-labelledby="confirmed-heading"
        className="rounded-card border border-t-4 border-line border-t-plum bg-paper p-6 shadow-card"
      >
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-indigo" aria-hidden="true" />
          <h2 id="confirmed-heading" className="text-lg">
            Information you confirmed
          </h2>
        </div>

        <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2">
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

        {selectedConfirmedFields.length > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line text-muted">
                  <th scope="col" className="py-2 pr-4 font-medium">
                    Detail
                  </th>
                  <th scope="col" className="py-2 pr-4 font-medium">
                    Value
                  </th>
                  <th scope="col" className="py-2 font-medium">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {selectedConfirmedFields.map((field) => (
                  <tr
                    key={`${field.documentId}-${field.name}`}
                    className="border-b border-line/70"
                  >
                    <th scope="row" className="py-2.5 pr-4 font-normal text-muted">
                      {humanizeFieldName(field.name)}
                    </th>
                    <td className="py-2.5 pr-4 font-medium text-ink">
                      {formatFieldValue(field)}
                    </td>
                    <td className="py-2.5">
                      <StatusBadge kind="field" status={field.state} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 text-muted">
            You haven’t confirmed any document details yet.{" "}
            <Link
              href="/profile"
              className="text-indigo underline underline-offset-4 hover:text-navy"
            >
              Go back to your documents
            </Link>{" "}
            to confirm information first.
          </p>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        {calculation ? (
          <CalculationBreakdown calculation={calculation} />
        ) : (
          <div className="flex items-start gap-3 rounded-card border border-line bg-paper p-6 shadow-card">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-forest" aria-hidden="true" />
            <p className="text-ink">
              Confirm your income on the{" "}
              <Link
                href="/profile"
                className="text-forest underline underline-offset-4 hover:text-forest-dark"
              >
                documents step
              </Link>{" "}
              to include the calculation.
            </p>
          </div>
        )}
        {rules.citation && <CitationCard citation={rules.citation} />}
      </div>

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
          Choose which ready documents go into your packet. Failed or unreviewed
          documents stay out until they’re fixed.
        </p>
        {includableDocuments.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {includableDocuments.map((doc) => {
              const included = state.packetSelections[doc.documentId] ?? true;
              return (
                <li key={doc.documentId}>
                  <label className="flex min-h-[44px] items-center gap-3 rounded-card border border-line px-3 py-2">
                    <input
                      type="checkbox"
                      checked={included}
                      onChange={() => {
                        dispatch({ type: "TOGGLE_PACKET_DOC", documentId: doc.documentId });
                        announce(
                          `${humanizeDocumentType(doc.documentType)} ${
                            included ? "removed from" : "added to"
                          } your packet.`
                        );
                      }}
                      className="h-5 w-5 shrink-0 accent-forest"
                    />
                    <span className="text-ink">
                      {humanizeDocumentType(doc.documentType)} · {doc.fileName}
                    </span>
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

      {conflictingFields.length > 0 && (
        <div
          role="alert"
          className="rounded-card border border-warning/50 bg-[#FBE8CE] p-4 text-sm text-[#9A5B00]"
        >
          We found different values for this information. Please choose the correct
          one.
          <div className="mt-2 font-medium">{conflictingFields.join(", ")}</div>
        </div>
      )}

      {attention.length > 0 && (
        <section
          aria-labelledby="attention-heading"
          className="rounded-card border border-line bg-paper p-6 shadow-card"
        >
          <h2 id="attention-heading" className="text-lg">
            Documents that still need attention
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

      {prepared && IS_MOCK && (
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

      <BottomNav>
        <BackButton href="/readiness" />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button
            variant="primary"
            onClick={() => void handleDownload(data)}
            disabled={conflictingFields.length > 0}
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Download packet
          </Button>
          <DeleteSessionButton compact />
        </div>
      </BottomNav>

      {IS_MOCK && (
        <p className="text-sm text-muted">
          Prototype download generated from confirmed mock information. It is not an
          official document.
        </p>
      )}
      <p className="text-sm font-medium text-forest-dark">
        ProofSetu helps prepare your information. A housing professional makes the
        final decision.
      </p>
    </div>
  );
}
