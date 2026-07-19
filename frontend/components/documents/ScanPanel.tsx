"use client";

import { useState } from "react";
import { AlertCircle, Camera, ImageUp, Loader2, ShieldCheck } from "lucide-react";
import { useAnnounce } from "@/lib/a11y/AnnouncerContext";
import { ScannerDialog } from "./ScannerDialog";

interface ScanPanelProps {
  /** Runs the mock extraction (same handler as file upload). */
  onScan: (file: File) => Promise<void>;
  label?: string;
}

/**
 * "Scan a document" tab: open the live camera scanner, or take/choose a photo
 * directly (mobile rear camera via capture, or a file on desktop). Both routes
 * feed the existing local mock extraction and confirm/correct workflow.
 */
export function ScanPanel({ onScan, label = "Scan a document" }: ScanPanelProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { announce } = useAnnounce();

  async function processFile(file: File) {
    setError(null);
    setScanning(true);
    announce("Reading your document…");
    try {
      await onScan(file);
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : "We couldn’t use that photo. Please try again.";
      setError(message);
      announce(message, "assertive");
    } finally {
      setScanning(false);
    }
  }

  function onPhotoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) void processFile(file);
  }

  return (
    <div className="rounded-card border border-line bg-cream p-6 shadow-card">
      <p className="text-muted">
        Place the whole document inside the frame and make sure the text is clear.
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          disabled={scanning}
          className="focus-gradient inline-flex min-h-[44px] items-center gap-2 rounded-card border border-transparent bg-primary-gradient px-5 py-2.5 font-medium text-white shadow-card transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60 focus-visible:outline-none"
        >
          <Camera className="h-4 w-4" aria-hidden="true" />
          {label}
        </button>

        <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-card border border-clay bg-paper px-5 py-2.5 font-medium text-clay transition-all duration-200 hover:-translate-y-0.5 hover:bg-clay/10 focus-within:outline-none focus-within:ring-2 focus-within:ring-clay">
          <ImageUp className="h-4 w-4" aria-hidden="true" />
          Take or choose a photo
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={onPhotoFile}
            disabled={scanning}
            className="sr-only"
            aria-label="Take a photo with your camera, or choose a photo of your document"
          />
        </label>
      </div>

      {scanning && (
        <div
          className="mt-4 flex items-center gap-2 rounded-card border border-line bg-blush/70 p-3 text-plum"
          role="status"
          aria-live="polite"
        >
          <Loader2 className="h-5 w-5 animate-spin text-clay" aria-hidden="true" />
          <span className="font-medium">Reading your document…</span>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mt-4 flex items-start gap-2 rounded-card border border-danger/40 bg-[#F8E4E3] p-3 text-danger"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <p className="mt-4 flex items-start gap-2 rounded-card border border-line bg-blush/70 p-3 text-sm text-muted">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-clay" aria-hidden="true" />
        <span>
          The camera is used only while you scan. This prototype does not upload or
          permanently store the image.
        </span>
      </p>
      <p className="mt-2 text-xs font-medium text-clay">
        Demo scan. Sample extraction results are being used.
      </p>

      {dialogOpen && (
        <ScannerDialog
          onCapture={processFile}
          onClose={() => setDialogOpen(false)}
        />
      )}
    </div>
  );
}
