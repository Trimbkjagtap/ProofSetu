"use client";

import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { useInfoCenter, type InfoKey } from "./InfoCenter";
import { DeleteSessionButton } from "./DeleteSessionButton";

const LINKS: { key: InfoKey; label: string }[] = [
  { key: "how", label: "How it works" },
  { key: "privacy", label: "Privacy" },
  { key: "accessibility", label: "Accessibility" },
  { key: "help", label: "Help" },
];

/** Header navigation: a segmented desktop group and an anchored mobile menu. */
export function HeaderNav() {
  const { openInfo } = useInfoCenter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    const firstLink = menuRef.current?.querySelector<HTMLButtonElement>(
      "button:not([disabled])"
    );
    firstLink?.focus();

    const closeOnOutsideClick = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!menuRef.current?.contains(target) && !menuButtonRef.current?.contains(target)) {
        setMenuOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);

  function selectLink(key: InfoKey) {
    setMenuOpen(false);
    openInfo(key);
  }

  return (
    <div className="relative flex items-center shrink-0">
      <nav
        aria-label="Main"
        className="hidden items-center divide-x divide-line overflow-hidden rounded-[11px] border border-line md:flex"
      >
        {LINKS.map((link) => (
          <button
            key={link.key}
            type="button"
            onClick={() => openInfo(link.key)}
            className="px-3 py-2 text-sm font-medium text-ink transition-colors duration-200 hover:bg-clay/10 focus-visible:outline-none"
          >
            {link.label}
          </button>
        ))}
      </nav>

      <div className="hidden md:block md:pl-3">
        <DeleteSessionButton compact />
      </div>

      <button
        ref={menuButtonRef}
        type="button"
        onClick={() => setMenuOpen((open) => !open)}
        aria-expanded={menuOpen}
        aria-controls="mobile-menu"
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        className="inline-flex min-h-[44px] items-center gap-2 rounded-[11px] border border-line px-3 text-sm font-medium text-plum hover:bg-clay/10 focus-visible:outline-none md:hidden"
      >
        {menuOpen ? (
          <X className="h-5 w-5" aria-hidden="true" />
        ) : (
          <Menu className="h-5 w-5" aria-hidden="true" />
        )}
        <span>Menu</span>
      </button>

      {menuOpen && (
        <div
          ref={menuRef}
          id="mobile-menu"
          role="region"
          aria-label="Menu"
          className="menu-panel absolute right-0 top-full z-40 mt-2 w-[min(18rem,calc(100vw-2rem))] rounded-card border border-line bg-paper p-3 shadow-raised md:hidden"
        >
          <nav aria-label="Menu" className="flex flex-col">
            {LINKS.map((link) => (
              <button
                key={link.key}
                type="button"
                onClick={() => selectLink(link.key)}
                className="min-h-[44px] rounded-card px-3 text-left font-medium text-ink hover:bg-sage focus-visible:outline-none"
              >
                {link.label}
              </button>
            ))}
          </nav>

          <div className="mt-3 border-t border-line pt-3">
            <DeleteSessionButton />
          </div>
        </div>
      )}
    </div>
  );
}
