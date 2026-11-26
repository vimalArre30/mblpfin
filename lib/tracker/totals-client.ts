import type { TotalsParams, TotalsResponse } from "./totals-types";

/** Browser-side call to GET /api/tracker/totals. Throws on any failure. */
export async function fetchTotals(p: TotalsParams = {}): Promise<TotalsResponse> {
  const q = new URLSearchParams();
  if (p.from) q.set("from", p.from);
  if (p.to) q.set("to", p.to);
  if (p.walletId) q.set("wallet_id", p.walletId);
  if (p.include?.length) q.set("include", p.include.join(","));
  if (p.categoryTypes?.length) q.set("category_types", p.categoryTypes.join(","));
  if (p.categoryTop) q.set("category_top", String(p.categoryTop));
  if (p.monthly) q.set("monthly", p.monthly);
  if (p.excludeOpening) q.set("exclude_opening", "1");
  const res = await fetch(`/api/tracker/totals?${q.toString()}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`totals request failed (${res.status})`);
  return (await res.json()) as TotalsResponse;
}

/** "2026-11-01" -> "Nov 2026" (display only). */
export function monthLabel(isoDate: string): string {
  return new Date(isoDate + "T00:00:00").toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
  });
}
