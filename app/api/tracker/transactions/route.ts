import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTotals } from "@/lib/tracker/totals";
import { dateParam, uuidParam, DATE_RE, UUID_RE } from "@/lib/tracker/query-params";
import {
  FREE_ENTRY_LIMIT,
  getUserPlan,
  incrementEntryCount,
  isAtFreeLimit,
} from "@/lib/tracker/plan";

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Plan / limit check
  let profile = await getUserPlan(supabase, user.id);

  if (!profile) {
    // First-time user — seed a blank profile row
    await supabase.from("user_profiles").insert({
      user_id: user.id,
      plan: "free",
      entry_count: 0,
    });
    profile = { plan: "free", plan_expires_at: null, entry_count: 0 };
  }

  if (isAtFreeLimit(profile)) {
    return NextResponse.json(
      { error: "limit_reached", entry_count: profile.entry_count, limit: FREE_ENTRY_LIMIT },
      { status: 402 }
    );
  }

  let body: {
    wallet_id?: string | null;
    category_id?: string | null;
    amount?: number;
    description?: string;
    date?: string;
    entry_type?: string;
    note?: string | null;
    label_ids?: string[];
    spending_type?: string | null;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { wallet_id, category_id, amount, description, date, entry_type, note, label_ids, spending_type } = body;

  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
    return NextResponse.json({ error: "amount is required and must be positive" }, { status: 400 });
  }

  const parsedAmount = Number(amount);
  const noteValue = note?.trim() || null;

  const { data: tx, error: txError } = await supabase
    .from("transactions")
    .insert({
      user_id: user.id,
      wallet_id: wallet_id || null,
      category_id: category_id || null,
      amount: parsedAmount,
      description: description?.trim() ?? "",
      date: date ?? new Date().toISOString().split("T")[0],
      entry_type: entry_type ?? "expense",
      type: entry_type === "income" ? "credit" : "debit",
      is_opening_balance: false,
      spending_type: entry_type === 'expense' ? (spending_type ?? null) : null,
      ...(noteValue ? { note: noteValue } : {}),
    })
    .select("id")
    .single();

  if (txError) {
    console.error("[transactions] insert error:", txError);
    return NextResponse.json({ error: txError.message }, { status: 500 });
  }

  // Insert labels
  if (label_ids && label_ids.length > 0 && tx) {
    await supabase.from("transaction_labels").insert(
      label_ids.map((lid) => ({ transaction_id: tx.id, label_id: lid }))
    );
  }

  // Increment entry count
  await incrementEntryCount(supabase, user.id, profile.entry_count);

  return NextResponse.json({ id: tx.id }, { status: 201 });
}

// ── GET: keyset-paged list ───────────────────────────────────────────────
// Order is (date desc, created_at desc, id desc) — the order the feeds have
// always shown. The cursor is "<date>|<created_at>|<id>" of the last row
// returned; the next page is everything strictly after it in that order.
const SELECT =
  "*, categories(name), wallet:wallets!transactions_wallet_id_fkey(name, emoji, color), transaction_labels(label_id, labels(name))";
const TS_RE = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}(:?\d{2})?)$/;

/**
 * GET /api/tracker/transactions
 *   limit        1..100 (default 50)
 *   cursor       opaque, from the previous response's next_cursor
 *   from, to     YYYY-MM-DD
 *   wallet_id    rows of one wallet (each transfer leg lives on its own wallet)
 *   category_id  one category
 *   entry_type   income | expense | transfer
 *   opening      include (default) | exclude | only   — opening-balance rows
 * Returns { rows, next_cursor, total }. `total` (rows matching the filters,
 * from the same SQL as the totals) is sent with the first page only.
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
  const categoryId = uuidParam(q.get("category_id"));
  if (from === undefined || to === undefined || walletId === undefined || categoryId === undefined) {
    return NextResponse.json({ error: "invalid_params" }, { status: 400 });
  }
  const entryType = q.get("entry_type");
  if (entryType && !["income", "expense", "transfer"].includes(entryType)) {
    return NextResponse.json({ error: "invalid_params" }, { status: 400 });
  }
  const opening = q.get("opening") ?? "include";
  if (!["include", "exclude", "only"].includes(opening)) {
    return NextResponse.json({ error: "invalid_params" }, { status: 400 });
  }

  const limitRaw = Number(q.get("limit") ?? 50);
  const limit = Number.isInteger(limitRaw) ? Math.min(Math.max(limitRaw, 1), 100) : 50;

  let cursor: { date: string; created_at: string; id: string } | null = null;
  const cursorRaw = q.get("cursor");
  if (cursorRaw) {
    const [cDate, cCreated, cId] = cursorRaw.split("|");
    if (!DATE_RE.test(cDate ?? "") || !TS_RE.test(cCreated ?? "") || !UUID_RE.test(cId ?? "")) {
      return NextResponse.json({ error: "invalid_cursor" }, { status: 400 });
    }
    cursor = { date: cDate, created_at: cCreated, id: cId };
  }

  let query = supabase.from("transactions").select(SELECT);
  if (from) query = query.gte("date", from);
  if (to) query = query.lte("date", to);
  if (walletId) query = query.eq("wallet_id", walletId);
  if (categoryId) query = query.eq("category_id", categoryId);
  if (entryType) query = query.eq("entry_type", entryType);
  if (opening === "exclude") query = query.eq("is_opening_balance", false);
  if (opening === "only") query = query.eq("is_opening_balance", true);
  if (cursor) {
    // (date, created_at, id) < (cursor) in descending order. Values were
    // validated against strict patterns above, so they cannot break out of
    // the filter expression.
    const { date, created_at, id } = cursor;
    query = query.or(
      `date.lt.${date},and(date.eq.${date},created_at.lt.${created_at}),and(date.eq.${date},created_at.eq.${created_at},id.lt.${id})`
    );
  }

  const { data, error } = await query
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1);

  if (error) {
    console.error("[transactions GET]", error);
    return NextResponse.json({ error: "list_failed" }, { status: 500 });
  }

  const hasMore = (data?.length ?? 0) > limit;
  const rows = hasMore ? data!.slice(0, limit) : data ?? [];
  const last = rows[rows.length - 1] as
    | { date: string; created_at: string; id: string }
    | undefined;
  const next_cursor = hasMore && last ? `${last.date}|${last.created_at}|${last.id}` : null;

  let total: number | undefined;
  if (!cursor) {
    try {
      if (opening === "include" && !categoryId && !entryType) {
        total = (await getTotals(supabase, { from, to, walletId })).entries;
      } else {
        // Filtered counts: exact head-count with the same filters.
        let c = supabase.from("transactions").select("id", { count: "exact", head: true });
        if (from) c = c.gte("date", from);
        if (to) c = c.lte("date", to);
        if (walletId) c = c.eq("wallet_id", walletId);
        if (categoryId) c = c.eq("category_id", categoryId);
        if (entryType) c = c.eq("entry_type", entryType);
        if (opening === "exclude") c = c.eq("is_opening_balance", false);
        if (opening === "only") c = c.eq("is_opening_balance", true);
        const { count, error: cErr } = await c;
        if (cErr) throw cErr;
        total = count ?? 0;
      }
    } catch (e) {
      console.error("[transactions GET] total", e);
      return NextResponse.json({ error: "count_failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ rows, next_cursor, ...(total !== undefined ? { total } : {}) });
}
