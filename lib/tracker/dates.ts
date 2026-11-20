/**
 * Local-calendar date helpers.
 *
 * `Date.prototype.toISOString()` converts to UTC first. For a local-midnight
 * date in a timezone ahead of UTC (e.g. IST, UTC+5:30) that lands on the
 * PREVIOUS calendar day, so `new Date(2026, 10, 1).toISOString()` is
 * "2026-10-31". Period ranges, "today" defaults and month options built that
 * way were off by one day for Indian users. Always format dates that were
 * built from local components with these helpers instead.
 */

/** Format a Date as YYYY-MM-DD using its LOCAL year/month/day. */
export function toLocalISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Today's date (local calendar) as YYYY-MM-DD. */
export function todayLocalISO(): string {
  return toLocalISO(new Date());
}
