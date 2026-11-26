import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getTotals } from "@/lib/tracker/totals";
import { getUserPlan, isProActive } from "@/lib/tracker/plan";
import { dateParam, uuidParam } from "@/lib/tracker/query-params";
import type { TotalsResponse } from "@/lib/tracker/totals-types";

export const MAX_EXPORT_ROWS = 10_000;
const PAGE = 1000; // PostgREST max_rows

export interface ExportRow {
  id: string;
  date: string;
  description: string | null;
  note: string | null;
  amount: number;
  entry_type: string | null;
  type: string | null;
  is_opening_balance: boolean | null;
  recurring_id: string | null;
  source: string | null; // column arrives with the WhatsApp migration; null until then
  categories: { name: string } | null;
  wallet: { name: string } | null;
  transaction_labels: { labels: { name: string } | null }[] | null;
}

export type ExportKind = "income" | "expense" | "transfer";

export function rowKind(r: ExportRow): ExportKind {
  if (r.entry_type === "income" || r.entry_type === "expense" || r.entry_type === "transfer") {
    return r.entry_type;
  }
  return r.type === "credit" ? "income" : "expense";
}

const SELECT =
  "id, date, description, note, amount, entry_type, type, is_opening_balance, recurring_id, source, created_at, categories(name), wallet:wallets!transactions_wallet_id_fkey(name), transaction_labels(labels(name))";
const SELECT_NO_SOURCE = SELECT.replace(" source,", "");
const TS_RE = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}(:?\d{2})?)$/;

/** Start (YYYY-MM-DD) of the current Indian financial year (1 April), in IST. */
export function currentFyStart(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(now);
  const y = Number(parts.find((p) => p.type === "year")!.value);
  const m = Number(parts.find((p) => p.type === "month")!.value);
  return `${m >= 4 ? y : y - 1}-04-01`;
}

export interface ExportContext {
  supabase: SupabaseClient;
  user: User;
  from: string;
  to: string;
  walletId: string | null;
  isPro: boolean;
  totals: TotalsResponse;
}

function fail(status: number, body: Record<string, unknown>) {
  return { error: NextResponse.json(body, { status }) } as const;
}

/**
 * Shared guard for both export routes: session, params, Free-plan rules and the
 * row cap. The cap is checked with the SQL count BEFORE any row is fetched.
 */
export async function prepareExport(
  req: NextRequest,
  opts: { proOnly: boolean; withCategories?: boolean }
): Promise<{ error: NextResponse } | ({ error?: undefined } & ExportContext)> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail(401, { error: "Unauthorized" });

  const q = req.nextUrl.searchParams;
  const from = dateParam(q.get("from"));
  const to = dateParam(q.get("to"));
  const walletId = uuidParam(q.get("wallet_id"));
  if (!from || !to || walletId === undefined || from > to) {
    return fail(400, { error: "invalid_params" });
  }

  const profile = await getUserPlan(supabase, user.id);
  const isPro = !!profile && isProActive(profile);
  if (opts.proOnly && !isPro) return fail(403, { error: "pro_required" });
  if (!isPro && from < currentFyStart()) {
    return fail(403, { error: "pro_required", reason: "range_before_current_fy" });
  }

  let totals: TotalsResponse;
  try {
    totals = await getTotals(supabase, {
      from,
      to,
      walletId,
      include: opts.withCategories ? ["by_category"] : [],
    });
  } catch (e) {
    console.error("[export] totals", e);
    return fail(500, { error: "export_failed" });
  }
  if (totals.entries > MAX_EXPORT_ROWS) {
    return fail(413, { error: "too_many_rows", entries: totals.entries, max: MAX_EXPORT_ROWS });
  }

  return { supabase, user, from, to, walletId, isPro, totals };
}

/**
 * Walk the keyset cursor (date desc, created_at desc, id desc) in pages of
 * 1,000 until the range is exhausted. Same order as the app's feeds.
 */
export async function fetchAllRows(ctx: ExportContext): Promise<ExportRow[]> {
  const out: ExportRow[] = [];
  let cursor: { date: string; created_at: string; id: string } | null = null;
  let select = SELECT;

  for (;;) {
    let query = ctx.supabase
      .from("transactions")
      .select(select)
      .gte("date", ctx.from)
      .lte("date", ctx.to);
    if (ctx.walletId) query = query.eq("wallet_id", ctx.walletId);
    if (cursor) {
      const { date, created_at, id } = cursor;
      query = query.or(
        `date.lt.${date},and(date.eq.${date},created_at.lt.${created_at}),and(date.eq.${date},created_at.eq.${created_at},id.lt.${id})`
      );
    }
    const res = await query
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(PAGE);

    if (res.error) {
      // `source` only exists once the WhatsApp migration has run; fall back.
      if (select === SELECT && /source/i.test(res.error.message)) {
        select = SELECT_NO_SOURCE;
        continue;
      }
      throw new Error(`export fetch failed: ${res.error.message}`);
    }
    const page = (res.data ?? []) as unknown as (ExportRow & { created_at: string })[];
    for (const r of page) out.push({ ...r, source: r.source ?? null });
    if (page.length < PAGE) break;
    const last: { date: string; created_at: string; id: string } = page[page.length - 1];
    if (!TS_RE.test(last.created_at)) throw new Error("export fetch failed: bad created_at");
    cursor = { date: last.date, created_at: last.created_at, id: last.id };
    if (out.length > MAX_EXPORT_ROWS + PAGE) throw new Error("export fetch failed: row cap");
  }
  return out;
}

export function exportFilename(from: string, to: string, ext: "csv" | "pdf") {
  return `mblpfin-${from}-to-${to}.${ext}`;
}

export interface MonthSummaryRow {
  key: string; // YYYY-MM
  income: number;
  expense: number;
  net: number;
  entries: number;
}

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * One SQL summary per calendar month in [from, to] (first/last month clipped to
 * the range). Uses totals_for_period per month so the wallet filter applies and
 * every number comes from the same SQL as the dashboard.
 */
export async function monthSummaries(ctx: ExportContext): Promise<MonthSummaryRow[]> {
  const out: { key: string; from: string; to: string }[] = [];
  let y = Number(ctx.from.slice(0, 4));
  let m = Number(ctx.from.slice(5, 7));
  const endKey = ctx.to.slice(0, 7);
  for (;;) {
    const key = `${y}-${pad(m)}`;
    if (key > endKey) break;
    const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
    out.push({
      key,
      from: key === ctx.from.slice(0, 7) ? ctx.from : `${key}-01`,
      to: key === endKey ? ctx.to : `${key}-${pad(last)}`,
    });
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return Promise.all(
    out.map(async (o) => {
      const t = await getTotals(ctx.supabase, { from: o.from, to: o.to, walletId: ctx.walletId });
      return { key: o.key, income: t.income, expense: t.expense, net: t.net, entries: t.entries };
    })
  );
}
