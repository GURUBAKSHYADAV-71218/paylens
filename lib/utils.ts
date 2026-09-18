/**
 * PAYLENS — small utilities shared across components.
 */

/** Merge class name strings, dropping falsy values. No external deps. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const inrFormatterDecimal = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

/** Formats a number as Indian Rupees, e.g. 1200000 -> "₹12,00,000". */
export function formatINR(value: number, opts?: { decimals?: boolean }): string {
  if (!Number.isFinite(value)) return "₹0";
  return opts?.decimals ? inrFormatterDecimal.format(value) : inrFormatter.format(Math.round(value));
}

/** Formats a plain number with Indian digit grouping, no currency symbol. */
export function formatIndianNumber(value: number): string {
  if (!Number.isFinite(value)) return "0";
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.round(value));
}

/** Formats a percentage to one decimal place, e.g. 82.456 -> "82.5%". */
export function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return "0%";
  return `${value.toFixed(1)}%`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
