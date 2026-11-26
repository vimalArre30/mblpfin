import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTotals } from "@/lib/tracker/totals";
import { dateParam, uuidParam } from "@/lib/tracker/query-params";
import type { TotalsInclude } from "@/lib/tracker/totals-types";

export const dynamic = "force-dynamic";

const INCLUDES: TotalsInclude[] = ["wallets", "by_category", "labels", "monthly"];

/**
 * GET /api/tracker/totals
 *   from, to      YYYY-MM-DD (local/IST dates; omit both for all time)
 *   wallet_id     restrict the summary / categories / labels to one wallet
 *   include       comma list of: wallets, by_category, labels, monthly
 *                 (default: none — summary only)
 *   category_types  by_category entry types, e.g. "expense" (default) or "expense,income"
 *   category_top  keep only the top N categories
 *   monthly       "last6" (default; dashboard window) or "period" (use from/to)
 *   exclude_opening=1  leave opening-balance rows out of the summary
 *
 * All figures come from SQL functions (migration 008): the browser never sums
 * transactions. Same response for web and Android.
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = req.nextUrl.searchParams;
  const from = dateParam(q.get("from"));
  const to = dateParam(q.get("to"));
  const walletId = uuidParam(q.get("wallet_id"));
  if (from === undefined || to === undefined || walletId === undefined) {
    return NextResponse.json({ error: "invalid_params" }, { status: 400 });
  }

  const include = (q.get("include") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is TotalsInclude => (INCLUDES as string[]).includes(s));

  const categoryTypes = (q.get("category_types") ?? "expense")
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is "expense" | "income" => s === "expense" || s === "income");

  const topRaw = Number(q.get("category_top"));
  const categoryTop = Number.isInteger(topRaw) && topRaw > 0 ? Math.min(topRaw, 100) : undefined;

  try {
    const totals = await getTotals(supabase, {
      from,
      to,
      walletId,
      include,
      categoryTypes: categoryTypes.length ? categoryTypes : ["expense"],
      categoryTop,
      monthly: q.get("monthly") === "period" ? "period" : "last6",
      excludeOpening: q.get("exclude_opening") === "1",
    });
    return NextResponse.json(totals);
  } catch (e) {
    console.error("[totals]", e);
    return NextResponse.json({ error: "totals_failed" }, { status: 500 });
  }
}
