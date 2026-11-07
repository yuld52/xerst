/**
 * Shared rule: money/return values that represent a loss must read red.
 * Used by every surface that prints Lucro, ROAS or profit-derived numbers.
 */

/** True when the value is a real negative number (a loss). */
export function isNegativeValue(value: number): boolean {
  return typeof value === "number" && Number.isFinite(value) && value < 0;
}

/** Tailwind class that paints the value red when it is negative. */
export function negativeTextClass(value: number): string {
  return isNegativeValue(value) ? "text-destructive" : "";
}
