import type { ExtractedField } from "@/types/domain";

/** Turn a snake_case field name into a human label, e.g. "gross_pay" → "Gross pay". */
export function humanizeFieldName(name: string): string {
  const label = name.replace(/_/g, " ").trim();
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** True when a field should be treated as a currency amount. */
export function isCurrencyField(field: Pick<ExtractedField, "name" | "value">): boolean {
  return (
    typeof field.value === "number" &&
    /(pay|income|amount|balance|wage|salary)/i.test(field.name)
  );
}

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/** Present a field value for display (currency where appropriate). */
export function formatFieldValue(
  field: Pick<ExtractedField, "name" | "value">
): string {
  if (isCurrencyField(field)) return currency.format(Number(field.value));
  return String(field.value);
}

/** Format a plain number as whole-dollar USD, e.g. 31800 → "$31,800". */
export function formatCurrency(value: number): string {
  return currency.format(value);
}

/** Format an ISO date (YYYY-MM-DD) as e.g. "May 1, 2026". Falls back to input. */
export function formatDate(iso: string): string {
  const parts = iso.split("-").map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return iso;
  const [y, m, d] = parts;
  const date = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/** Format bytes in a short, human-friendly way. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}
