// All dates in the API are plain calendar dates ("yyyy-MM-dd"), so they're handled in local time.
// Using toISOString() would give the UTC date, which is "yesterday" just after midnight in Europe.

export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function todayIso(): string {
  return toIsoDate(new Date());
}

export function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(iso: string, days: number): string {
  const date = parseIsoDate(iso);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

/** Whole days from `from` to `to` (positive when `to` is later). */
export function daysBetween(from: string, to: string): number {
  const ms = parseIsoDate(to).getTime() - parseIsoDate(from).getTime();
  return Math.round(ms / 86_400_000);
}

const locale = "en-GB";

/** "Thu 8 Oct" */
export function formatShort(iso: string): string {
  return parseIsoDate(iso).toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short" });
}

/** "Friday 9 October" */
export function formatLong(iso: string): string {
  return parseIsoDate(iso).toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" });
}

/** "8 Oct" */
export function formatDayMonth(iso: string): string {
  return parseIsoDate(iso).toLocaleDateString(locale, { day: "numeric", month: "short" });
}

/** "1 February 2027" */
export function formatFull(iso: string): string {
  return parseIsoDate(iso).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
}

/** "May 2026" */
export function formatMonthYear(iso: string): string {
  return parseIsoDate(iso).toLocaleDateString(locale, { month: "long", year: "numeric" });
}
