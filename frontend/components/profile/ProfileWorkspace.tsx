"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Info,
  RefreshCw,
  AlertCircle,
  Upload,
  ScanLine,
} from "lucide-react";
import type {
  DocumentRecord,
  DocumentSource,
  ExtractedField,
  RequestedType,
} from "@/types/domain";
import { apiClient, IS_MOCK } from "@/lib/api/client";
import { useApp } from "@/lib/state/AppContext";
import { useAnnounce } from "@/lib/a11y/AnnouncerContext";
import { useIsDesktop } from "@/lib/a11y/useMediaQuery";
import { humanizeDocumentType } from "@/lib/documents";
import { validateFile, fileSignature } from "@/lib/validation";
import { isDocumentSettled } from "@/lib/reviewStatus";
import { HouseholdSizeSelector } from "./HouseholdSizeSelector";
import { DocumentTypeSelect } from "@/components/documents/DocumentTypeSelect";
import { DocumentUploader } from "@/components/documents/DocumentUploader";
import { ScanPanel } from "@/components/documents/ScanPanel";
import { DocumentList } from "@/components/documents/DocumentList";
import { ManualEntry } from "@/components/documents/ManualEntry";
import { DocumentPreview } from "@/components/documents/DocumentPreview";
import { FieldCard } from "@/components/documents/FieldCard";
import { Button } from "@/components/ui/Button";
import { BottomNav } from "@/components/shell/BottomNav";
import { BackButton } from "@/components/shell/BackButton";

const EXTRACTION_ERROR =
  "We couldn’t read this document. Try a clearer scan or enter the information yourself.";

function makeLocalDocumentId(): string {
  return `doc_${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;
}

export function ProfileWorkspace() {
  const { state, dispatch } = useApp();
  const { announce } = useAnnounce();
  const router = useRouter();
  const isDesktop = useIsDesktop();
  const continueHelpId = useId();

  const [activeField, setActiveField] = useState<string | null>(null);
  const [viewTab, setViewTab] = useState<"document" | "details">("document");
  const [requestedType, setRequestedType] = useState<RequestedType>("auto");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [replaceId, setReplaceId] = useState<string | null>(null);
  const [addErrors, setAddErrors] = useState<string[]>([]);

  // Original extracted values (for Undo) and transient File handles (for Retry).
  // Neither is persisted to storage; both are cleared on delete-everything.
  const originals = useRef<Record<string, Record<string, string | number>>>({});
  const files = useRef<Record<string, File>>({});

  const docs = useMemo<DocumentRecord[]>(
    () => Object.values(state.documents),
    [state.documents]
  );
  const activeDoc = (activeId && state.documents[activeId]) || undefined;

  useEffect(() => {
    if (docs.length === 0) {
      originals.current = {};
      files.current = {};
      if (activeId !== null) setActiveId(null);
    } else if (!activeDoc) {
      setActiveId(docs[0].documentId);
    }
  }, [docs, activeDoc, activeId]);

  const existingSignatures = useMemo(() => {
    const set = new Set<string>();
    for (const doc of docs) {
      if (doc.documentId !== replaceId) {
        set.add(fileSignature(doc.fileName, doc.fileSize));
      }
    }
    return set;
  }, [docs, replaceId]);

  function upsertPendingDocument(
    localId: string,
    file: File,
    source: DocumentSource
  ): DocumentRecord {
    const pendingRecord: DocumentRecord = {
      documentId: localId,
      documentType: requestedType === "auto" ? "other" : requestedType,
      status: "uploading",
      fields: [],
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      source,
      requestedType,
    };
    dispatch({ type: "UPSERT_DOCUMENT", document: pendingRecord });
    files.current[localId] = file;
    return pendingRecord;
  }

  async function processDocument(
    file: File,
    source: DocumentSource,
    localId: string
  ): Promise<void> {
    try {
      const res = await apiClient.uploadDocument(file, requestedType);
      const record: DocumentRecord = {
        ...res,
        documentId: localId,
        backendDocumentId: res.documentId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        source,
        requestedType,
      };
      originals.current[localId] = Object.fromEntries(
        record.fields.map((field) => [field.name, field.value])
      );
      dispatch({ type: "UPSERT_DOCUMENT", document: record });
      announce(
        record.fields.length > 0
          ? `${humanizeDocumentType(record.documentType)} added. Review the details.`
          : "Document added, but we couldn’t read details. You can enter them yourself."
      );
    } catch {
      const failedRecord: DocumentRecord = {
        documentId: localId,
        documentType: requestedType === "auto" ? "other" : requestedType,
        status: "needs_attention",
        fields: [],
        error: EXTRACTION_ERROR,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        source,
        requestedType,
      };
      dispatch({ type: "UPSERT_DOCUMENT", document: failedRecord });
      announce(EXTRACTION_ERROR, "assertive");
    }
  }

  async function handleFiles(incomingFiles: File[], source: DocumentSource) {
    setAddErrors([]);

    if (replaceId && incomingFiles.length > 1) {
      setAddErrors(["Choose one replacement document at a time."]);
      announce("Choose one replacement document at a time.", "assertive");
      return;
    }

    const baseCount = docs.length - (replaceId ? 1 : 0);
    const nextSignatures = new Set(existingSignatures);
    const validFiles: File[] = [];
    const errors: string[] = [];

    for (const file of incomingFiles) {
      const error = validateFile(file, nextSignatures, baseCount + validFiles.length);
      if (error) {
        errors.push(error);
        continue;
      }
      nextSignatures.add(fileSignature(file.name, file.size));
      validFiles.push(file);
    }

    if (errors.length > 0) {
      const uniqueErrors = [...new Set(errors)];
      setAddErrors(uniqueErrors);
      announce(uniqueErrors[0], "assertive");
    }

    if (validFiles.length === 0) return;

    const filesToProcess = replaceId ? validFiles.slice(0, 1) : validFiles;
    const localIds = filesToProcess.map((file, index) =>
      replaceId && index === 0 ? replaceId : makeLocalDocumentId()
    );

    localIds.forEach((localId, index) =>
      upsertPendingDocument(localId, filesToProcess[index], source)
    );

    setActiveId(localIds[0] ?? null);
    setReplaceId(null);

    await Promise.all(
      filesToProcess.map((file, index) =>
        processDocument(file, source, localIds[index])
      )
    );
  }

  async function handleUpload(files: File[]) {
    await handleFiles(files, "upload");
  }

  async function handleScan(file: File) {
    await handleFiles([file], "scan");
  }

  function handleRemove(id: string) {
    dispatch({ type: "REMOVE_DOCUMENT", documentId: id });
    delete originals.current[id];
    delete files.current[id];
    if (activeId === id) setActiveId(null);
    if (replaceId === id) setReplaceId(null);
    announce("Document removed.");
  }

  function handleReplace(id: string) {
    setReplaceId(id);
    setAddErrors([]);
    announce("Choose a replacement document.");
  }

  function handleReview(id: string) {
    setActiveId(id);
    setViewTab("document");
  }

  async function handleRetry(id: string) {
    const doc = state.documents[id];
    const file = files.current[id];
    if (!doc || !file) return;
    setReplaceId(id);
    await handleFiles([file], doc.source);
  }

  const allSettled = docs.length > 0 && docs.every(isDocumentSettled);
  const continueDisabled = !allSettled;
  const continueHelp =
    docs.length === 0
      ? "Add a document and confirm its details to continue."
      : !allSettled
        ? "Confirm or change every detail to continue."
        : null;

  const originalFields: ExtractedField[] = useMemo(() => {
    if (!activeDoc) return [];
    const original = originals.current[activeDoc.documentId] ?? {};
    return activeDoc.fields.map((field) => ({
      ...field,
      value: original[field.name] ?? field.value,
    }));
  }, [activeDoc]);

  const renderPreview = () =>
    activeDoc ? (
      <DocumentPreview
        documentLabel={humanizeDocumentType(activeDoc.documentType)}
        file={files.current[activeDoc.documentId]}
        fileName={activeDoc.fileName}
        pageCount={Math.max(1, ...activeDoc.fields.map((field) => field.sourceBox.page), 1)}
        fields={originalFields}
      />
    ) : null;

  const renderDetails = () => {
    if (!activeDoc) return null;
    const unconfirmed = activeDoc.fields.filter(
      (field) => field.state === "unconfirmed" || field.state === "please_check"
    ).length;

    return (
      <section aria-labelledby="extracted-heading" className="space-y-4">
        <div>
          <h2 id="extracted-heading" className="text-xl">
            Check what we found
          </h2>
          <p className="mt-1 text-muted">
            Please confirm each detail. If something is wrong, you can change it.
          </p>
        </div>

        {activeDoc.warnings?.map((warning) => (
          <div
            key={warning}
            role="status"
            className="flex items-start gap-2 rounded-card border border-warning/40 bg-[#FBE8CE] p-3 text-sm text-[#9A5B00]"
          >
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{warning}</span>
          </div>
        ))}

        <div
          className={[
            "flex items-center gap-2 rounded-card border p-3 text-sm",
            activeDoc.fields.length > 0 && unconfirmed === 0
              ? "border-success/40 bg-sage text-plum"
              : "border-line bg-paper text-muted",
          ].join(" ")}
          role="status"
        >
          {activeDoc.fields.length > 0 && unconfirmed === 0 ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-success" aria-hidden="true" />
          ) : (
            <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
          )}
          <span>
            {activeDoc.fields.length === 0
              ? "No details yet. Add them below."
              : unconfirmed === 0
                ? "All details are confirmed."
                : `${unconfirmed} detail${unconfirmed === 1 ? "" : "s"} still need your review.`}
          </span>
        </div>

        <div className="space-y-3">
          {activeDoc.fields.map((field) => (
            <FieldCard
              key={field.name}
              field={field}
              originalValue={
                originals.current[activeDoc.documentId]?.[field.name] ?? field.value
              }
              isActive={activeField === field.name}
              onActivate={setActiveField}
              onUpdate={(update) =>
                dispatch({
                  type: "UPDATE_FIELD",
                  documentId: activeDoc.documentId,
                  field: update,
                })
              }
            />
          ))}
        </div>

        {(activeDoc.error || activeDoc.fields.length === 0) && (
          <ManualEntry
            onAdd={(field: ExtractedField) =>
              dispatch({
                type: "ADD_FIELD",
                documentId: activeDoc.documentId,
                field,
              })
            }
          />
        )}

        {state.calculationStale && (
          <div
            role="status"
            className="flex items-start gap-2 rounded-card border border-warning/40 bg-[#FBE8CE] p-3 text-sm text-[#9A5B00]"
          >
            <RefreshCw className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              You changed a value used in the income calculation. It will be
              recalculated on the next step.
            </span>
          </div>
        )}
      </section>
    );
  };

  const viewTabClass = (tab: "document" | "details") =>
    [
      "min-h-[44px] rounded-card border text-sm font-medium transition-all duration-200 focus-visible:outline-none",
      viewTab === tab
        ? "border-transparent bg-primary-gradient text-white shadow-card"
        : "border-line bg-paper text-plum hover:bg-clay/10",
    ].join(" ");

  const showReview = activeDoc && !replaceId;
  const replacingDoc = replaceId ? state.documents[replaceId] : null;

  return (
    <div className="space-y-8">
      <HouseholdSizeSelector />

      {IS_MOCK && (
        <div className="flex items-start gap-2 rounded-card border border-clay/40 bg-blush p-3 text-sm text-plum">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-clay" aria-hidden="true" />
          <span>Demo mode. Sample extraction results are being used.</span>
        </div>
      )}

      {docs.length > 0 && (
        <section aria-labelledby="docs-list-heading" className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 id="docs-list-heading" className="text-lg">
              Your documents ({docs.length})
            </h2>
          </div>
          <DocumentList
            docs={docs}
            activeId={activeId}
            onReview={handleReview}
            onReplace={handleReplace}
            onRemove={handleRemove}
          />
        </section>
      )}

      <section aria-labelledby="add-heading" className="space-y-4">
        <div>
          <h2 id="add-heading" className="text-lg">
            {replaceId ? "Replace a document" : docs.length === 0 ? "Add your documents" : "Add more documents"}
          </h2>
          <p className="mt-1 text-muted">
            Upload files and scan documents in any order. Both actions stay available
            throughout this step.
          </p>
          {replacingDoc && (
            <p className="mt-2 text-sm font-medium text-clay">
              Replacing: {replacingDoc.fileName}
            </p>
          )}
        </div>

        <DocumentTypeSelect value={requestedType} onChange={setRequestedType} />

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3 rounded-card border border-line bg-paper p-4 shadow-card">
            <div className="flex items-center gap-2 text-ink">
              <Upload className="h-4 w-4 text-clay" aria-hidden="true" />
              <h3 className="font-medium">Add files</h3>
            </div>
            <DocumentUploader
              onFiles={handleUpload}
              label={docs.length === 0 || replaceId ? "Add files" : "Add more files"}
            />
          </div>

          <div className="space-y-3 rounded-card border border-line bg-paper p-4 shadow-card">
            <div className="flex items-center gap-2 text-ink">
              <ScanLine className="h-4 w-4 text-clay" aria-hidden="true" />
              <h3 className="font-medium">Scan a document</h3>
            </div>
            <ScanPanel
              onScan={handleScan}
              label={docs.length === 0 || replaceId ? "Scan a document" : "Scan another document"}
            />
          </div>
        </div>

        {addErrors.length > 0 && (
          <div className="space-y-2" role="alert">
            {addErrors.map((error) => (
              <div
                key={error}
                className="flex items-start gap-2 rounded-card border border-danger/40 bg-[#F8E4E3] p-3 text-sm text-danger"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {activeDoc && activeDoc.error && !replaceId && (
        <section className="space-y-4">
          <div
            role="alert"
            className="flex items-start gap-2 rounded-card border border-danger/40 bg-[#F8E4E3] p-4 text-danger"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-medium">{activeDoc.error}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {files.current[activeDoc.documentId] && (
                  <Button
                    variant="secondary"
                    onClick={() => void handleRetry(activeDoc.documentId)}
                  >
                    <RefreshCw className="h-4 w-4" aria-hidden="true" />
                    Retry
                  </Button>
                )}
                <Button
                  variant="secondary"
                  onClick={() => handleReplace(activeDoc.documentId)}
                >
                  Replace document
                </Button>
              </div>
            </div>
          </div>
          {renderDetails()}
        </section>
      )}

      {showReview && activeDoc && !activeDoc.error && activeDoc.fields.length > 0 &&
        (isDesktop ? (
          <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
            <div className="lg:sticky lg:top-24">{renderPreview()}</div>
            <div>{renderDetails()}</div>
          </div>
        ) : (
          <div>
            <div
              role="tablist"
              aria-label="Document and details"
              className="mb-4 grid grid-cols-2 gap-2"
            >
              <button
                type="button"
                role="tab"
                id="tab-document"
                aria-selected={viewTab === "document"}
                aria-controls="tabpanel-view"
                onClick={() => setViewTab("document")}
                className={viewTabClass("document")}
              >
                Document
              </button>
              <button
                type="button"
                role="tab"
                id="tab-details"
                aria-selected={viewTab === "details"}
                aria-controls="tabpanel-view"
                onClick={() => setViewTab("details")}
                className={viewTabClass("details")}
              >
                Details
              </button>
            </div>
            <div
              key={viewTab}
              id="tabpanel-view"
              role="tabpanel"
              aria-labelledby={`tab-${viewTab}`}
              className="motion-safe:animate-tab-slide"
            >
              {viewTab === "document" ? renderPreview() : renderDetails()}
            </div>
          </div>
        ))}

      {showReview && activeDoc && !activeDoc.error && activeDoc.fields.length === 0 && (
        <section className="space-y-4">{renderDetails()}</section>
      )}

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
