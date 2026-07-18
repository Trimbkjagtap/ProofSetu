"use client";

import { useRef, useState } from "react";
import { UploadCloud, FileText, FlaskConical, AlertCircle } from "lucide-react";
import { useApp } from "@/lib/state/AppContext";
import { useAnnounce } from "@/lib/a11y/AnnouncerContext";

const ACCEPTED = ["application/pdf", "image/jpeg", "image/png"];
const ACCEPTED_EXT = /\.(pdf|jpe?g|png)$/i;
const ACCEPT_ATTR = ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png";

interface DocumentUploaderProps {
  /** Runs the (mock) upload + extraction. Resolves when the document is ready. */
  onFile: (file: File) => Promise<void>;
  disabled?: boolean;
}

/**
 * Accessible document uploader. Keyboard users reach the file input directly
 * (focus ring shows on the labelled control); mouse users can also drag-and-drop.
 * Progress and outcomes are announced via the live region.
 */
export function DocumentUploader({ onFile, disabled = false }: DocumentUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { state } = useApp();
  const { announce } = useAnnounce();

  function validate(file: File): boolean {
    const okType = ACCEPTED.includes(file.type) || ACCEPTED_EXT.test(file.name);
    if (!okType) {
      const message =
        "That file type isn’t supported. Please upload a PDF, JPG, or PNG.";
      setError(message);
      announce(message, "assertive");
      return false;
    }
    return true;
  }

  async function handleFile(file: File) {
    setError(null);
    if (!validate(file)) return;

    setUploading(true);
    setProgress(0);
    announce(`Uploading ${file.name}.`);

    // Simulated progress while the (mock) extraction runs. Text updates via the
    // live region cover reduced-motion users.
    const animate = !state.prefs.reducedMotion;
    const timer = animate
      ? window.setInterval(() => {
          setProgress((p) => (p < 90 ? p + 10 : p));
        }, 90)
      : undefined;
    if (!animate) setProgress(90);

    try {
      await onFile(file);
      setProgress(100);
      announce("Document uploaded. Review the information we read below.");
    } catch {
      setError("We couldn’t read that document. Please try again.");
      announce("We couldn’t read that document. Please try again.", "assertive");
    } finally {
      if (timer) window.clearInterval(timer);
      setUploading(false);
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
    // Allow re-selecting the same file.
    e.target.value = "";
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (disabled || uploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled && !uploading) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={[
          "rounded-card border-2 border-dashed p-6 text-center transition-colors",
          dragOver ? "border-forest bg-sage" : "border-line bg-paper",
          disabled ? "opacity-60" : "",
        ].join(" ")}
      >
        <UploadCloud className="mx-auto h-8 w-8 text-emerald" aria-hidden="true" />
        <p className="mt-3 font-medium text-ink">
          Drop your file here, or choose one from your device.
        </p>

        <label
          className={[
            "mt-4 inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-card border border-transparent bg-primary-gradient px-5 py-2.5 font-medium text-white shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-raised hover:brightness-[1.06] focus-within:outline-none focus-within:ring-2 focus-within:ring-citation focus-within:ring-offset-2",
            disabled || uploading ? "pointer-events-none opacity-60" : "",
          ].join(" ")}
        >
          <FileText className="h-4 w-4" aria-hidden="true" />
          <span>Choose a file</span>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT_ATTR}
            onChange={onInputChange}
            disabled={disabled || uploading}
            className="sr-only"
            aria-label="Choose a document to upload (PDF, JPG, or PNG)"
          />
        </label>

        <p className="mt-3 flex items-center justify-center gap-1.5 text-sm text-muted">
          Accepted formats: PDF, JPG, PNG
        </p>
        <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-muted">
          <FlaskConical className="h-4 w-4 shrink-0 text-forest" aria-hidden="true" />
          Use synthetic documents only — never real personal information.
        </p>
      </div>

      {uploading && (
        <div className="mt-4" role="status" aria-live="polite">
          <div className="mb-1 flex justify-between text-sm text-muted">
            <span>Uploading and reading your document…</span>
            <span>{progress}%</span>
          </div>
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-sage"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Upload progress"
          >
            <div
              className="h-full rounded-full bg-forest transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mt-4 flex items-start gap-2 rounded-card border border-danger/40 bg-[#FCEBEA] p-3 text-danger"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
