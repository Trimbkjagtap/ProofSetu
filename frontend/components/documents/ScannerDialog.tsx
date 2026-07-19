"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Camera,
  Check,
  ImageUp,
  Loader2,
  RotateCcw,
  X,
} from "lucide-react";
import { useFocusTrap } from "@/lib/a11y/useFocusTrap";
import { useAnnounce } from "@/lib/a11y/AnnouncerContext";

interface ScannerDialogProps {
  /** Runs the mock extraction on the captured/selected image. */
  onCapture: (file: File) => Promise<void>;
  onClose: () => void;
}

type CamError = "denied" | "unavailable" | null;

/**
 * Accessible camera scan dialog. Requests the camera only after it is opened
 * (never automatically), shows a live preview with corner guides, and stops all
 * tracks when a scan completes, the dialog closes, or it unmounts (navigation).
 * Uses the existing local mock extraction — no real OCR and no image storage.
 */
export function ScannerDialog({ onCapture, onClose }: ScannerDialogProps) {
  const containerRef = useFocusTrap<HTMLDivElement>(true, onClose);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { announce } = useAnnounce();

  const [error, setError] = useState<CamError>(null);
  const [captured, setCaptured] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const startCamera = useCallback(async () => {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("unavailable");
      announce("Your device or browser does not support the camera.", "assertive");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
    } catch (err) {
      const name = err instanceof DOMException ? err.name : "";
      if (name === "NotAllowedError" || name === "SecurityError") {
        setError("denied");
        announce("Camera permission was blocked.", "assertive");
      } else {
        setError("unavailable");
        announce("No camera was found.", "assertive");
      }
    }
  }, [announce]);

  // Start on mount (the dialog only mounts after the user clicks Open camera).
  useEffect(() => {
    void startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  // Clean up the preview object URL.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function handleCapture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        setCaptured(blob);
        setPreviewUrl(URL.createObjectURL(blob));
        announce("Document captured. Review it, then use the scan or retake.");
      },
      "image/jpeg",
      0.9
    );
  }

  function handleRetake() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setCaptured(null);
  }

  async function runExtraction(file: File) {
    setProcessing(true);
    announce("Reading your document…");
    stopCamera();
    await onCapture(file);
    // The parent switches to the review view once the document is set.
    onClose();
  }

  async function handleUse() {
    if (!captured) return;
    await runExtraction(new File([captured], "scanned-document.jpg", {
      type: "image/jpeg",
    }));
  }

  function onFallbackFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) void runExtraction(file);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-plum/45" aria-hidden="true" onClick={onClose} />
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="scan-title"
        aria-describedby="scan-desc"
        className="relative z-10 w-full max-w-lg rounded-card border border-line bg-cream shadow-raised"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-3">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-clay" aria-hidden="true" />
            <h2 id="scan-title" className="text-lg">
              Scan a document
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close scanner"
            className="flex h-10 w-10 items-center justify-center rounded-card border border-line text-muted hover:bg-clay/10 focus-visible:outline-none"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="p-5">
          <p id="scan-desc" className="text-sm text-muted">
            Place the whole document inside the frame and make sure the text is clear.
          </p>

          {/* Live preview / captured still / processing */}
          <div className="relative mt-3 aspect-[4/3] w-full overflow-hidden rounded-card border border-line bg-plum/90">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="The document you captured"
                className="h-full w-full object-contain"
              />
            ) : (
              <video
                ref={videoRef}
                muted
                playsInline
                autoPlay
                aria-label="Live camera preview"
                className="h-full w-full object-cover"
              />
            )}

            {/* Clay corner guides (hidden once captured) */}
            {!previewUrl && !error && (
              <div aria-hidden="true" className="pointer-events-none absolute inset-4">
                <span className="absolute left-0 top-0 h-8 w-8 rounded-tl-md border-l-4 border-t-4 border-clay" />
                <span className="absolute right-0 top-0 h-8 w-8 rounded-tr-md border-r-4 border-t-4 border-clay" />
                <span className="absolute bottom-0 left-0 h-8 w-8 rounded-bl-md border-b-4 border-l-4 border-clay" />
                <span className="absolute bottom-0 right-0 h-8 w-8 rounded-br-md border-b-4 border-r-4 border-clay" />
              </div>
            )}

            {processing && (
              <div
                className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-cream/90 text-plum"
                role="status"
                aria-live="polite"
              >
                <Loader2 className="h-6 w-6 animate-spin text-clay" aria-hidden="true" />
                <span className="font-medium">Reading your document…</span>
              </div>
            )}
          </div>

          <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

          {/* Permission / availability error */}
          {error && (
            <div
              role="alert"
              className="mt-3 flex items-start gap-2 rounded-card border border-danger/40 bg-[#F8E4E3] p-3 text-sm text-danger"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                {error === "denied"
                  ? "We couldn’t use the camera because permission was blocked. You can allow camera access in your browser, or choose a photo instead."
                  : "No camera is available on this device. You can choose a photo instead."}
              </span>
            </div>
          )}

          {/* Controls */}
          <div className="mt-4 flex flex-wrap gap-2">
            {error ? (
              <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-card border border-clay bg-paper px-4 py-2 font-medium text-clay hover:bg-clay/10 focus-within:outline-none focus-within:ring-2 focus-within:ring-clay">
                <ImageUp className="h-4 w-4" aria-hidden="true" />
                Choose a photo instead
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={onFallbackFile}
                  className="sr-only"
                  aria-label="Choose a photo of your document"
                />
              </label>
            ) : previewUrl ? (
              <>
                <button
                  type="button"
                  onClick={handleUse}
                  disabled={processing}
                  className="focus-gradient inline-flex min-h-[44px] items-center gap-2 rounded-card border border-transparent bg-primary-gradient px-5 py-2.5 font-medium text-white shadow-card transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60 focus-visible:outline-none"
                >
                  <Check className="h-4 w-4" aria-hidden="true" />
                  Use this scan
                </button>
                <button
                  type="button"
                  onClick={handleRetake}
                  disabled={processing}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-card border border-line bg-paper px-5 py-2.5 font-medium text-plum hover:bg-clay/10 disabled:opacity-60 focus-visible:outline-none"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  Retake
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleCapture}
                className="focus-gradient inline-flex min-h-[44px] items-center gap-2 rounded-card border border-transparent bg-primary-gradient px-5 py-2.5 font-medium text-white shadow-card transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none"
              >
                <Camera className="h-4 w-4" aria-hidden="true" />
                Capture document
              </button>
            )}
          </div>

          <p className="mt-4 rounded-card border border-line bg-blush/70 p-3 text-xs text-muted">
            The camera is used only while you scan. This prototype does not upload or
            permanently store the image.
          </p>
          <p className="mt-2 text-xs font-medium text-clay">
            Demo scan. Sample extraction results are being used.
          </p>
        </div>
      </div>
    </div>
  );
}
