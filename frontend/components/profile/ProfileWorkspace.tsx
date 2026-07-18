"use client";

import { useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
import { Button } from "@/components/ui/Button";
import { BottomNav } from "@/components/shell/BottomNav";
import { BackButton } from "@/components/shell/BackButton";

/** Orchestrates upload → preview + evidence → confirm/correct for the profile step. */
export function ProfileWorkspace() {
  const { state, dispatch } = useApp();
  const router = useRouter();
  const continueHelpId = useId();
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

  // Continue is gated until a document is uploaded AND every field is settled.
  const continueDisabled = !document || unconfirmedCount > 0;
  const continueHelp = !document
    ? "Add a document and confirm its details to continue."
    : unconfirmedCount > 0
      ? `Please confirm or change all ${document.fields.length} details to continue.`
      : null;

  return (
    <div className="space-y-8">
      <HouseholdSizeSelector />

      {!document ? (
        <section aria-labelledby="upload-heading" className="space-y-4">
          <h2 id="upload-heading" className="text-lg">
            Add a document
          </h2>
          {/* Small local animation for the upload area (accessible alt text). */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/upload-check.svg"
            alt="A document being filed away and marked with a checkmark"
            width={240}
            height={150}
            className="mx-auto h-28 w-auto"
          />
          <DocumentUploader onFile={handleUpload} />
          <EmptyState
            Icon={FileSearch}
            title="Nothing added yet"
            description="Once you add a synthetic pay stub, we’ll show what we found and let you confirm each detail."
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
                Check what we found
              </h2>
              <p className="mt-1 text-muted">
                Please confirm each detail. If something is wrong, you can change it.
                Hover or focus a card to see where it came from on the document.
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
          </section>
        </div>
      )}

      {/* Bottom navigation: Back to Consent + gated Continue. */}
      <BottomNav>
        <BackButton href="/consent" />
        <Button
          variant="primary"
          onClick={() => router.push("/fit-check")}
          disabled={continueDisabled}
          aria-describedby={continueHelp ? continueHelpId : undefined}
        >
          Continue
          <ArrowRight
            className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </Button>
      </BottomNav>
      {continueHelp && (
        <p id={continueHelpId} className="mt-2 text-right text-sm text-muted">
          {continueHelp}
        </p>
      )}
    </div>
  );
}
