/**
 * Thin, safe wrapper around gtag() for custom GA4 events.
 *
 * - Never throws: analytics must not be able to break the app.
 * - Safe to call before gtag.js has loaded: events are queued on dataLayer
 *   and replayed by gtag.js once it initialises.
 * - Drops undefined/null params (GA4 rejects them).
 *
 * PRIVACY: never pass raw amounts, free-text descriptions/notes, names, phone
 * numbers or emails. Use `amountBucket()` for money.
 */

type ParamValue = string | number | boolean | null | undefined;
export type EventParams = Record<string, ParamValue | Record<string, unknown>[]>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function ensureGtag(): ((...args: unknown[]) => void) | null {
  if (typeof window === "undefined") return null;
  if (!window.gtag) {
    window.dataLayer = window.dataLayer || [];
    // Must push `arguments` (not an array) — that is what gtag.js expects.
    window.gtag = function gtagStub() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments);
    };
  }
  return window.gtag;
}

export function track(event: string, params: EventParams = {}): void {
  try {
    const gtag = ensureGtag();
    if (!gtag) return;
    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) clean[k] = v;
    }
    gtag("event", event, clean);
  } catch {
    // swallow — analytics must never break the UI
  }
}

/** Coarse INR amount bucket so raw amounts are never sent to GA. */
export function amountBucket(amount: number): string {
  const a = Math.abs(Number(amount));
  if (!isFinite(a)) return "unknown";
  if (a < 100) return "<100";
  if (a < 500) return "100-499";
  if (a < 1000) return "500-999";
  if (a < 5000) return "1000-4999";
  if (a < 20000) return "5000-19999";
  return "20000+";
}
