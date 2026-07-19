"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  FilePlus2,
  Pause,
  Play,
  PackageCheck,
  SearchCheck,
  type LucideIcon,
} from "lucide-react";
import { useApp } from "@/lib/state/AppContext";
import { useSystemReducedMotion } from "@/lib/a11y/useReducedMotion";

interface Slide {
  Icon: LucideIcon;
  title: string;
  body: string;
}

const SLIDES: Slide[] = [
  {
    Icon: FilePlus2,
    title: "Add your documents",
    body: "Upload the files you already have or scan a document with your camera.",
  },
  {
    Icon: SearchCheck,
    title: "Check the details",
    body: "Review what ProofSetu found and change anything that looks wrong.",
  },
  {
    Icon: PackageCheck,
    title: "Prepare your packet",
    body: "Choose what to include, then download your packet when you’re ready.",
  },
];

const AUTOPLAY_MS = 5000;

/** Compact, accessible "How ProofSetu works" carousel for the Consent page. */
export function HowItWorksSlider() {
  const { state } = useApp();
  const systemReduced = useSystemReducedMotion();
  const canAutoplay = !systemReduced && !state.prefs.reducedMotion;

  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(canAutoplay);
  const regionId = useId();
  const timer = useRef<number | null>(null);

  const count = SLIDES.length;
  const go = useCallback(
    (next: number) => setIndex((next + count) % count),
    [count]
  );

  // Autoplay (disabled entirely under reduced motion).
  useEffect(() => {
    if (!canAutoplay || !playing) return;
    timer.current = window.setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, AUTOPLAY_MS);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [canAutoplay, playing, count]);

  // Keep the play state honest if the preference changes.
  useEffect(() => {
    if (!canAutoplay) setPlaying(false);
  }, [canAutoplay]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      go(index + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(index - 1);
    }
  }

  const current = SLIDES[index];

  return (
    <section
      aria-roledescription="carousel"
      aria-label="How ProofSetu works"
      aria-describedby={regionId}
      onKeyDown={onKeyDown}
      className="rounded-card border border-line bg-panel-gradient p-4 shadow-card"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-navy">How ProofSetu works</h2>
        {canAutoplay && (
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            aria-pressed={playing}
            className="inline-flex h-9 items-center gap-1.5 rounded-card border border-line px-3 text-sm font-medium text-navy hover:bg-sage focus-visible:outline-none"
          >
            {playing ? (
              <Pause className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Play className="h-4 w-4" aria-hidden="true" />
            )}
            {playing ? "Pause" : "Play"}
          </button>
        )}
      </div>

      {/* Viewport */}
      <div className="overflow-hidden rounded-card">
        <div
          className="flex transition-transform duration-200 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {SLIDES.map((slide, i) => (
            <div
              key={slide.title}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
              aria-hidden={i !== index}
              className="flex w-full shrink-0 items-start gap-3 px-1 py-1"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-card bg-white text-indigo shadow-card">
                <slide.Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="font-semibold text-ink">{slide.title}</p>
                <p className="text-sm text-muted">{slide.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="mt-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => go(index - 1)}
          aria-label="Previous slide"
          className="inline-flex h-10 w-10 items-center justify-center rounded-card border border-line text-navy hover:bg-sage focus-visible:outline-none"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>

        <div className="flex items-center gap-2" role="tablist" aria-label="Choose slide">
          {SLIDES.map((slide, i) => (
            <button
              key={slide.title}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Go to slide ${i + 1}: ${slide.title}`}
              onClick={() => go(i)}
              className={[
                "h-2.5 rounded-full transition-all duration-200 focus-visible:outline-none",
                i === index ? "w-6 bg-indigo" : "w-2.5 bg-line hover:bg-muted",
              ].join(" ")}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => go(index + 1)}
          aria-label="Next slide"
          className="inline-flex h-10 w-10 items-center justify-center rounded-card border border-line text-navy hover:bg-sage focus-visible:outline-none"
        >
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      {/* Screen-reader announcement of the active slide. */}
      <p id={regionId} className="sr-only" aria-live="polite">
        Slide {index + 1} of {count}: {current.title}. {current.body}
      </p>
    </section>
  );
}
