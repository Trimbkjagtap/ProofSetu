"use client";

import { useState } from "react";
import { UploadCloud, FileText, Loader2 } from "lucide-react";
import { ACCEPT_ATTR } from "@/lib/config";

interface DocumentUploaderProps {
  /** Receives one or more selected/dropped files (validation happens upstream). */
  onFiles: (files: File[]) => Promise<void>;
  /** Button label — e.g. "Add files" or "Add more files". */
  label?: string;
  disabled?: boolean;
}

/**
 * Accessible multi-file dropzone. Keyboard users reach the file input directly;
 * mouse users can also drag-and-drop several files at once. Validation and error
 * messages are handled by the parent so multi-file results can be summarised.
 */
export function DocumentUploader({
  onFiles,
  label = "Add files",
  disabled = false,
}: DocumentUploaderProps) {
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleFiles(list: FileList | null) {
    const files = list ? Array.from(list) : [];
    if (files.length === 0) return;
    setBusy(true);
    try {
      await onFiles(files);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled && !busy) setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (!disabled && !busy) void handleFiles(e.dataTransfer.files);
      }}
      className={[
        "rounded-card border-2 border-dashed p-6 text-center transition-colors",
        dragOver ? "border-clay bg-clay/10" : "border-line bg-paper",
        disabled ? "opacity-60" : "",
      ].join(" ")}
    >
      <UploadCloud className="mx-auto h-8 w-8 text-clay" aria-hidden="true" />
      <p className="mt-3 font-medium text-ink">
        Drop your files here, or choose from your device.
      </p>

      <label
        className={[
          "mt-4 inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-card border border-transparent bg-primary-gradient px-5 py-2.5 font-medium text-white shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-raised hover:brightness-[1.06] focus-within:outline-none focus-within:ring-2 focus-within:ring-clay focus-within:ring-offset-2",
          disabled || busy ? "pointer-events-none opacity-60" : "",
        ].join(" ")}
      >
        <FileText className="h-4 w-4" aria-hidden="true" />
        <span aria-hidden="true" className="mr-0.5">📤</span>
        {label}
        <input
          type="file"
          accept={ACCEPT_ATTR}
          multiple
          onChange={(e) => {
            void handleFiles(e.target.files);
            e.target.value = "";
          }}
          disabled={disabled || busy}
          className="sr-only"
          aria-label="Choose documents to upload (PDF, Word, JPG, or PNG). You can select several at once."
        />
      </label>

      <p className="mt-3 text-sm text-muted">
        Accepted: PDF, Word (.doc, .docx), JPG, PNG · up to 15 MB each
      </p>

      {busy && (
        <div
          className="mt-3 flex items-center justify-center gap-2 text-sm text-muted"
          role="status"
          aria-live="polite"
        >
          <Loader2 className="h-4 w-4 animate-spin text-clay" aria-hidden="true" />
          Adding your documents…
        </div>
      )}
    </div>
  );
}
