"use client";

import { Users } from "lucide-react";
import { useApp } from "@/lib/state/AppContext";
import { useAnnounce } from "@/lib/a11y/AnnouncerContext";

const SIZES = [1, 2, 3, 4, 5, 6, 7, 8];

/** Accessible household-size selector backed by a native <select>. */
export function HouseholdSizeSelector() {
  const { state, dispatch } = useApp();
  const { announce } = useAnnounce();

  return (
    <section
      aria-labelledby="household-heading"
      className="rounded-card border border-line bg-paper p-5 shadow-card"
    >
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-forest" aria-hidden="true" />
        <h2 id="household-heading" className="text-lg">
          Household size
        </h2>
      </div>
      <p className="mt-1 text-sm text-muted">
        How many people live in your household, including you?
      </p>

      <label
        htmlFor="household-size"
        className="mt-4 block text-sm font-medium text-ink"
      >
        Number of people
      </label>
      <select
        id="household-size"
        value={state.householdSize}
        onChange={(e) => {
          const size = Number(e.target.value);
          dispatch({ type: "SET_HOUSEHOLD_SIZE", size });
          announce(
            `Household size set to ${size}${size === 8 ? " or more" : ""}.`
          );
        }}
        className="mt-1 min-h-[44px] w-full max-w-[16rem] rounded-card border border-line bg-white px-3 py-2 text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-citation"
      >
        {SIZES.map((n) => (
          <option key={n} value={n}>
            {n === 8 ? "8 or more" : n} {n === 1 ? "person" : "people"}
          </option>
        ))}
      </select>
    </section>
  );
}
