import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CategoryTotal,
  LabelTotal,
  MonthlyTotal,
  TotalsParams,
  TotalsResponse,
  WalletBalance,
} from "./totals-types";

/** First day of the month `monthsBack` months before today, in Asia/Kolkata. */
export function istMonthStart(monthsBack: number, now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(now);
  const y = Number(parts.find((p) => p.type === "year")!.value);
  const m = Number(parts.find((p) => p.type === "month")!.value) - 1;
  const d = new Date(Date.UTC(y, m - monthsBack, 1));
  return d.toISOString().slice(0, 10);
}

const num = (v: unknown) => Number(v ?? 0);

/**
 * Every figure the dashboard, wallet pages, analytics and export need, computed
 * in SQL (migration 008) — one summary plus whichever extras are requested.
 * Runs as the signed-in user, so RLS applies. Throws on any RPC error: callers
 * must never render partial totals.
 */
export async function getTotals(
  supabase: SupabaseClient,
  p: TotalsParams = {}
): Promise<TotalsResponse> {
  const include = new Set(p.include ?? []);
  const from = p.from ?? null;
  const to = p.to ?? null;
  const walletId = p.walletId ?? null;

  const summaryP = supabase.rpc("totals_for_period", {
    p_from: from,
    p_to: to,
    p_wallet_id: walletId,
    p_exclude_opening: p.excludeOpening ?? false,
  });
  const walletsP = include.has("wallets") ? supabase.rpc("wallet_balances") : null;
  const catP = include.has("by_category")
    ? supabase.rpc("spend_by_category", {
        p_from: from,
        p_to: to,
        p_wallet_id: walletId,
        p_entry_types: p.categoryTypes ?? ["expense"],
      })
    : null;
  const labelsP = include.has("labels")
    ? supabase.rpc("label_spend", { p_from: from, p_to: to, p_wallet_id: walletId })
    : null;
  const monthlyFrom =
    p.monthly === "period" ? from ?? istMonthStart(5) : istMonthStart(5);
  const monthlyTo = p.monthly === "period" ? to : null;
  const monthlyP = include.has("monthly")
    ? supabase.rpc("monthly_totals", { p_from: monthlyFrom, p_to: monthlyTo })
    : null;

  const [summaryR, walletsR, catR, labelsR, monthlyR] = await Promise.all([
    summaryP,
    walletsP,
    catP,
    labelsP,
    monthlyP,
  ]);

  for (const [name, r] of [
    ["totals_for_period", summaryR],
    ["wallet_balances", walletsR],
    ["spend_by_category", catR],
    ["label_spend", labelsR],
    ["monthly_totals", monthlyR],
  ] as const) {
    if (r && r.error) throw new Error(`${name} failed: ${r.error.message}`);
  }

  const s = (summaryR.data?.[0] ?? {}) as Record<string, unknown>;
  const income = num(s.income);
  const expense = num(s.expense);
  const transfers = num(s.transfers);

  const out: TotalsResponse = {
    income,
    expense,
    transfers_in: num(s.transfers_in),
    transfers_out: num(s.transfers_out),
    transfers,
    expense_count: num(s.expense_count),
    entries: num(s.entries),
    net: income - expense,
    balance: income - expense + transfers,
  };

  if (walletsR) {
    out.wallets = ((walletsR.data ?? []) as Record<string, unknown>[]).map(
      (w): WalletBalance => ({
        wallet_id: String(w.wallet_id),
        income: num(w.income),
        expense: num(w.expense),
        transfers_in: num(w.transfers_in),
        transfers_out: num(w.transfers_out),
        balance: num(w.balance),
        entries: num(w.entries),
      })
    );
  }

  if (catR) {
    const rows = (catR.data ?? []) as {
      category_id: string | null;
      total: number;
      entries: number;
    }[];
    const ids = rows.map((r) => r.category_id).filter((x): x is string => !!x);
    const names = new Map<string, string>();
    if (ids.length > 0) {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name")
        .in("id", ids);
      if (error) throw new Error(`categories lookup failed: ${error.message}`);
      for (const c of data ?? []) names.set(c.id, c.name);
    }
    let cats: CategoryTotal[] = rows.map((r) => ({
      category_id: r.category_id,
      name: r.category_id ? names.get(r.category_id) ?? "Uncategorised" : "Uncategorised",
      total: num(r.total),
      entries: num(r.entries),
    }));
    // rows arrive sorted by total desc from SQL
    if (p.categoryTop) cats = cats.slice(0, p.categoryTop);
    out.by_category = cats;
  }

  if (labelsR) {
    out.labels = ((labelsR.data ?? []) as Record<string, unknown>[]).map(
      (l): LabelTotal => ({
        name: String(l.label_name),
        total: num(l.total),
        entries: num(l.entries),
      })
    );
  }

  if (monthlyR) {
    out.monthly = ((monthlyR.data ?? []) as Record<string, unknown>[]).map(
      (m): MonthlyTotal => ({
        month: String(m.month).slice(0, 10),
        income: num(m.income),
        expense: num(m.expense),
      })
    );
  }

  return out;
}
