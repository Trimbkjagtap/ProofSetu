"use client";

import { useInfoCenter, type InfoKey } from "./InfoCenter";
import { LogoMark } from "./LogoMark";

const LINKS: { key: InfoKey; label: string }[] = [
  { key: "how", label: "How it works" },
  { key: "accessibility", label: "Accessibility" },
  { key: "privacy", label: "Privacy" },
];

/** Consistent, structured footer shown on every page. */
export function Footer() {
  const { openInfo } = useInfoCenter();

  return (
    <div className="px-4 pb-6 pt-2 sm:px-6">
      <footer className="mx-auto w-full max-w-shell overflow-hidden rounded-[20px] border border-line bg-cream shadow-card">
        <div className="grid gap-8 p-6 sm:p-8 md:grid-cols-3">
          {/* Column 1 — brand */}
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-primary-gradient p-2 text-white shadow-clay">
                <LogoMark className="h-full w-full" />
              </span>
              <span className="font-serif text-lg font-semibold text-plum">
                ProofSetu
              </span>
            </div>
            <p className="mt-3 max-w-prose text-muted">
              Your documents, organized for the next conversation.
            </p>
          </div>

          {/* Column 2 — links in small bordered boxes */}
          <nav aria-label="Footer">
            <ul className="flex flex-col gap-2">
              {LINKS.map((link) => (
                <li key={link.key}>
                  <button
                    type="button"
                    onClick={() => openInfo(link.key)}
                    className="w-full rounded-[11px] border border-line bg-paper px-3 py-2 text-left text-sm font-medium text-ink transition-colors duration-200 hover:bg-clay/10 focus-visible:outline-none"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Column 3 — help */}
          <div>
            <p className="font-semibold text-plum">Need help?</p>
            <p className="mt-2 max-w-prose text-muted">
              Open the Setu help assistant for guidance on any step.
            </p>
          </div>
        </div>

        {/* Bottom strip */}
        <div className="border-t border-line bg-blush/60 px-6 py-4 text-sm text-muted sm:px-8">
          <p>Hack-Nation 2026 prototype · Synthetic documents only</p>
          <p className="mt-1">
            ProofSetu prepares information. A housing professional makes the final
            decision.
          </p>
        </div>
      </footer>
    </div>
  );
}
