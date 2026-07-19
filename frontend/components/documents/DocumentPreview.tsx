"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  FileImage,
  FileText,
  Search,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";
import type { ExtractedField } from "@/types/domain";
import { formatBytes, humanizeFieldName } from "@/lib/format";
import { fileFormatLabel, isWordDocument } from "@/lib/documents";

interface DocumentPreviewProps {
  documentLabel: string;
  file?: File;
  fileName: string;
  pageCount: number;
  fields: ExtractedField[];
}

const MIN_ZOOM = 0.75;
const MAX_ZOOM = 2;
const STEP = 0.25;

/**
 * Synthetic document preview with a toolbar (file name, type, page count, zoom)
 * and evidence highlights. The page sits in a soft indigo frame with a paper
 * shadow. No document content is fabricated — highlights show what was read.
 */
export function DocumentPreview({
  documentLabel,
  file,
  fileName,
  pageCount,
  fields,
}: DocumentPreviewProps) {
  const [zoom, setZoom] = useState(1);
  const [page, setPage] = useState(1);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const pct = Math.round(zoom * 100);
  const format = fileFormatLabel(fileName);
  const imagePreview =
    !!file &&
    (file.type.startsWith("image/") || /\.(jpe?g|png)$/i.test(fileName));
  const wordPreview = isWordDocument(fileName);
  const pdfPreview =
    !!file && (file.type === "application/pdf" || /\.pdf$/i.test(fileName));

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    setPage(1);
    setZoom(1);
  }, [fileName]);

  const evidence = useMemo(
    () =>
      fields
        .filter((field) => field.evidenceText)
        .map((field) => ({
          name: humanizeFieldName(field.name),
          page: field.sourceBox.page,
          snippet: field.evidenceText as string,
        })),
    [fields]
  );

  return (
    <figure className="overflow-hidden rounded-card border border-line bg-paper shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-softblue px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          {imagePreview ? (
            <FileImage className="h-4 w-4 shrink-0 text-indigo" aria-hidden="true" />
          ) : (
            <FileText className="h-4 w-4 shrink-0 text-indigo" aria-hidden="true" />
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink" title={fileName}>
              {fileName}
            </p>
            <p className="text-xs text-muted">
              {documentLabel} · {format}
              {pdfPreview ? ` · Page ${page} of ${pageCount}` : ""}
            </p>
          </div>
        </div>

        {imagePreview && (
          <div className="flex items-center gap-1" role="group" aria-label="Zoom controls">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(MIN_ZOOM, +(z - STEP).toFixed(2)))}
              disabled={zoom <= MIN_ZOOM}
              aria-label="Zoom out"
              className="flex h-9 w-9 items-center justify-center rounded-card border border-line bg-paper text-navy hover:bg-sage disabled:opacity-50 focus-visible:outline-none"
            >
              <ZoomOut className="h-4 w-4" aria-hidden="true" />
            </button>
            <span className="w-12 text-center text-sm tabular-nums text-muted" aria-live="polite">
              {pct}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(MAX_ZOOM, +(z + STEP).toFixed(2)))}
              disabled={zoom >= MAX_ZOOM}
              aria-label="Zoom in"
              className="flex h-9 w-9 items-center justify-center rounded-card border border-line bg-paper text-navy hover:bg-sage disabled:opacity-50 focus-visible:outline-none"
            >
              <ZoomIn className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setZoom(1)}
              aria-label="Reset zoom"
              className="flex h-9 w-9 items-center justify-center rounded-card border border-line bg-paper text-navy hover:bg-sage focus-visible:outline-none"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}

        {pdfPreview && pageCount > 1 && (
          <div className="flex items-center gap-1" role="group" aria-label="Page navigation">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page <= 1}
              aria-label="Previous page"
              className="flex h-9 w-9 items-center justify-center rounded-card border border-line bg-paper text-navy hover:bg-sage disabled:opacity-50 focus-visible:outline-none"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <span className="w-16 text-center text-sm tabular-nums text-muted">
              {page} / {pageCount}
            </span>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
              disabled={page >= pageCount}
              aria-label="Next page"
              className="flex h-9 w-9 items-center justify-center rounded-card border border-line bg-paper text-navy hover:bg-sage disabled:opacity-50 focus-visible:outline-none"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      <div className="max-h-[70vh] overflow-auto bg-softblue/60 p-4">
        {!file && (
          <div className="rounded-card border border-line bg-paper p-6 text-sm text-muted">
            Preview is available only while this tab stays open. You can still review
            the extracted information below.
          </div>
        )}

        {file && pdfPreview && previewUrl && (
          <iframe
            src={`${previewUrl}#page=${page}`}
            title={`Preview of ${fileName}`}
            className="min-h-[70vh] w-full rounded-card border border-indigo/25 bg-white shadow-raised"
          />
        )}

        {file && imagePreview && previewUrl && (
          <div className="mx-auto" style={{ width: `${zoom * 100}%` }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt={`Preview of ${fileName}`}
              className="w-full rounded-card border border-indigo/25 bg-white shadow-raised"
            />
          </div>
        )}

        {file && wordPreview && (
          <div className="space-y-4 rounded-card border border-line bg-paper p-5 shadow-raised">
            <div className="flex items-start gap-3">
              <FileText className="mt-0.5 h-5 w-5 shrink-0 text-indigo" aria-hidden="true" />
              <div>
                <p className="font-medium text-ink">{fileName}</p>
                <p className="text-sm text-muted">
                  {documentLabel} · {format} · {formatBytes(file.size)}
                </p>
              </div>
            </div>
            <p className="rounded-card border border-line bg-blush/60 p-3 text-sm text-muted">
              Preview isn’t available for this Word document, but you can still review
              the information we found.
            </p>
            {evidence.length > 0 ? (
              <ul className="space-y-2">
                {evidence.map((item, index) => (
                  <li key={`${item.name}-${index}`} className="rounded-card border border-line p-3">
                    <p className="text-sm font-medium text-ink">{item.name}</p>
                    <p className="mt-1 text-sm text-muted">{item.snippet}</p>
                    <p className="mt-1 text-xs text-muted">Page or section: {item.page}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex items-start gap-2 rounded-card border border-line bg-cream p-3 text-sm text-muted">
                <Search className="mt-0.5 h-4 w-4 shrink-0 text-clay" aria-hidden="true" />
                <span>Extraction details will appear here when evidence snippets are available.</span>
              </div>
            )}
          </div>
        )}
      </div>

      <figcaption className="border-t border-line px-4 py-2 text-xs text-muted">
        {wordPreview
          ? "Word document preview is limited in this prototype, but extracted evidence is still shown when available."
          : "Preview shown from the file you added in this session."}
      </figcaption>
    </figure>
  );
}
