"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, FileSearch, Info, RefreshCw } from "lucide-react";
import type { ExtractedField, ExtractionResponse, FieldUpdate } from "@/types/domain";
import { apiClient } from "@/lib/api/client";
import { useApp } from "@/lib/state/AppContext";
import { humanizeDocumentType } from "@/lib/documents";
import { HouseholdSizeSelector } from "./HouseholdSizeSelector";
import { DocumentUploader } from "@/components/documents/DocumentUploader";
import { DocumentPreview } from "@/components/documents/DocumentPreview";
import { FieldCard } from "@/components/documents/FieldCard";
import { EmptyState } from "@/components/ui/EmptyState";

/** Orchestrates upload → preview + evidence → confirm/correct for the profile step. */
export function ProfileWorkspace() {
  const { state, dispatch } = useApp();
  const [activeField, setActiveField] = useState<string | null>(null);
  // Original values captured at upload time, keyed by documentId then field name.
  const originals = useRef<Record<string, Record<string, string | number>>>({});

  const document = useMemo<ExtractionResponse | undefined>(
    () => Object.values(state.documents)[0],
    [state.documents]
  );

  async function handleUpload(file: File) {
    const res = await apiClient.uploadDocument(file);
    originals.current[res.documentId] = Object.fromEntries(
      res.fields.map((f) => [f.name, f.value])
    );
    dispatch({ type: "UPSERT_DOCUMENT", document: res });
  }

  function handleFieldUpdate(documentId: string, field: FieldUpdate) {
    dispatch({ type: "UPDATE_FIELD", documentId, field });
  }

  // Evidence boxes reflect what was originally read from the document.
  const originalFields: ExtractedField[] = useMemo(() => {
    if (!document) return [];
    const orig = originals.current[document.documentId] ?? {};
    return document.fields.map((f) => ({ ...f, value: orig[f.name] ?? f.value }));
  }, [document]);

  const unconfirmedCount = document
    ? document.fields.filter(
        (f) => f.state === "unconfirmed" || f.state === "please_check"
      ).length
    : 0;

  const docLabel = document
    ? humanizeDocumentType(document.documentType)
    : "document";

  return (
    <div className="space-y-6">
      <HouseholdSizeSelector />

      {!document ? (
        <section aria-labelledby="upload-heading" className="space-y-4">
          <h2 id="upload-heading" className="text-lg">
            Upload a document
          </h2>
          <DocumentUploader onFile={handleUpload} />
          <EmptyState
            Icon={FileSearch}
            title="No document yet"
            description="Once you upload a synthetic pay stub, we’ll show what we read and let you confirm each detail."
          />
        </section>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
          {/* Left: document preview + evidence highlights */}
          <div className="lg:sticky lg:top-4">
            <DocumentPreview
              documentLabel={docLabel}
              fields={originalFields}
              activeName={activeField}
              onActivate={setActiveField}
            />
          </div>

          {/* Right: editable extracted information */}
          <section aria-labelledby="extracted-heading" className="space-y-4">
            <div>
              <h2 id="extracted-heading" className="text-xl">
                Information we read
              </h2>
              <p className="mt-1 text-muted">
                Confirm or correct each detail. Hover or focus a card to see where it
                was read on the document.
              </p>
            </div>

            <div
              className={[
                "flex items-center gap-2 rounded-card border p-3 text-sm",
                unconfirmedCount === 0
                  ? "border-forest/30 bg-sage text-forest-dark"
                  : "border-line bg-paper text-muted",
              ].join(" ")}
              role="status"
            >
              {unconfirmedCount === 0 ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              ) : (
                <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
              )}
              <span>
                {unconfirmedCount === 0
                  ? "All details are confirmed."
                  : `${unconfirmedCount} detail${unconfirmedCount === 1 ? "" : "s"} still ${
                      unconfirmedCount === 1 ? "needs" : "need"
                    } your review.`}
              </span>
            </div>

            <div className="space-y-3">
              {document.fields.map((field) => (
                <FieldCard
                  key={field.name}
                  field={field}
                  originalValue={
                    originals.current[document.documentId]?.[field.name] ??
                    field.value
                  }
                  isActive={activeField === field.name}
                  onActivate={setActiveField}
                  onUpdate={(update) =>
                    handleFieldUpdate(document.documentId, update)
                  }
                />
              ))}
            </div>

            {state.calculationStale && (
              <div
                role="status"
                className="flex items-start gap-2 rounded-card border border-warning/40 bg-[#FBF3E0] p-3 text-sm text-warning"
              >
                <RefreshCw className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  You corrected a value used in the income calculation. It will be
                  recalculated on the next step.
                </span>
              </div>
            )}

            <div className="border-t border-line pt-4">
              <Link
                href="/fit-check"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-card border border-forest bg-forest px-5 py-2.5 font-medium text-paper hover:bg-forest-dark focus-visible:outline-none"
              >
                Continue to rules and calculation
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <p className="mt-2 text-sm text-muted">
                ProofSetu prepares. You confirm. A qualified housing professional
                decides.
              </p>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
