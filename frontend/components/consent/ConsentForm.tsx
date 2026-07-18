"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  FlaskConical,
  Clock3,
  UserCheck,
  ShieldOff,
  Trash2,
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { useApp } from "@/lib/state/AppContext";
import { useAnnounce } from "@/lib/a11y/AnnouncerContext";
import { Button } from "@/components/ui/Button";
import { AccessibilityPreferences } from "./AccessibilityPreferences";
import { WhatWeUseDialog } from "./WhatWeUseDialog";

const POINTS = [
  {
    Icon: FlaskConical,
    text: "This prototype uses synthetic documents only — never your real personal information.",
  },
  {
    Icon: Clock3,
    text: "We keep your information only for this visit, then it’s gone.",
  },
  {
    Icon: UserCheck,
    text: "You confirm every detail before it’s used.",
  },
  {
    Icon: ShieldOff,
    text: "ProofSetu helps prepare your information. A housing professional makes the final decision.",
  },
  {
    Icon: Trash2,
    text: "You can delete everything at any time from the header.",
  },
];

/** The complete consent experience: what ProofSetu does, and required agreement. */
export function ConsentForm() {
  const [agreed, setAgreed] = useState(false);
  const [starting, setStarting] = useState(false);
  const { dispatch } = useApp();
  const { announce } = useAnnounce();
  const router = useRouter();
  const helperId = useId();

  async function handleStart() {
    if (!agreed || starting) return;
    setStarting(true);
    announce("Starting your document check.");
    try {
      const session = await apiClient.createSession();
      dispatch({ type: "SET_SESSION", session });
      dispatch({ type: "SET_CONSENT", consented: true });
      router.push("/profile");
    } catch {
      setStarting(false);
      announce("We could not start your session. Please try again.", "assertive");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr] lg:items-start">
      <div className="space-y-6">
        {/* Program context */}
        <section
          aria-label="Program and area"
          className="flex flex-wrap gap-x-8 gap-y-2 rounded-card border border-line bg-sage/50 p-4"
        >
          <div>
            <p className="text-sm text-muted">Housing program</p>
            <p className="font-medium text-ink">LIHTC 2026</p>
          </div>
          <div>
            <p className="text-sm text-muted">Metro area</p>
            <p className="font-medium text-ink">Cambridge / Boston</p>
          </div>
        </section>

        {/* What to expect */}
        <section
          aria-labelledby="what-to-expect"
          className="rounded-card border border-line bg-paper p-6 shadow-card"
        >
          <h2 id="what-to-expect" className="text-lg">
            Before you begin
          </h2>
          <ul className="mt-4 space-y-3">
            {POINTS.map(({ Icon, text }) => (
              <li key={text} className="flex items-start gap-3">
                <Icon
                  className="mt-0.5 h-5 w-5 shrink-0 text-forest"
                  aria-hidden="true"
                />
                <span className="text-ink">{text}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5">
            <WhatWeUseDialog />
          </div>
        </section>

        {/* Consent + start */}
        <section
          aria-labelledby="consent-heading"
          className="rounded-card border border-line bg-paper p-6 shadow-card"
        >
          <h2 id="consent-heading" className="text-lg">
            Your agreement
          </h2>
          <label className="mt-4 flex items-start gap-3">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 h-5 w-5 shrink-0 accent-forest"
            />
            <span className="text-ink">
              I understand ProofSetu uses synthetic documents, keeps my information
              only for this visit, and doesn’t decide eligibility. I’m ready to
              begin.
            </span>
          </label>

          <Button
            variant="primary"
            className="mt-5"
            onClick={handleStart}
            disabled={!agreed || starting}
            aria-describedby={!agreed ? helperId : undefined}
          >
            {starting ? (
              "Getting started…"
            ) : (
              <>
                Continue
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </>
            )}
          </Button>
          {!agreed && (
            <p id={helperId} className="mt-2 text-sm text-muted">
              Please check the box above to continue.
            </p>
          )}
        </section>
      </div>

      {/* Sidebar: preferences + reassurance */}
      <div className="space-y-6">
        <AccessibilityPreferences />
        <div className="rounded-card border border-line bg-panel-gradient p-5 shadow-card">
          <div className="flex items-start gap-2">
            <CheckCircle2
              className="mt-0.5 h-5 w-5 shrink-0 text-emerald"
              aria-hidden="true"
            />
            <p className="font-medium text-forest-dark">
              ProofSetu helps prepare your information. A housing professional makes
              the final decision.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
