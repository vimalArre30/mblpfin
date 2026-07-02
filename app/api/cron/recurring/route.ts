import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * GET /api/cron/recurring
 *
 * Called daily by Vercel Cron at 06:00 IST (00:30 UTC).
 * Finds all active recurring templates whose day_of_month = today,
 * checks if a transaction was already created this month (idempotency),
 * and inserts one if not.
 *
 * Secured with CRON_SECRET header — Vercel sets this automatically
 * when the route is defined in vercel.json.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const today = new Date();
  const dayOfMonth   = today.getDate();
  const monthStart   = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString().split("T")[0];           // e.g. "2026-07-01"
  const todayStr     = today.toISOString().split("T")[0]; // e.g. "2026-07-14"

  // Fetch all active templates due today whose date range covers this month
  const { data: templates, error: fetchErr } = await supabase
    .from("recurring_transactions")
    .select("*, recurring_transaction_labels(label_id)")
    .eq("day_of_month", dayOfMonth)
    .eq("is_active", true)
    .lte("start_month", monthStart)
    .or(`end_month.is.null,end_month.gte.${monthStart}`);

  if (fetchErr) {
    console.error("[cron/recurring] fetch error:", fetchErr.message);
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }

  if (!templates || templates.length === 0) {
    return NextResponse.json({ created: 0, skipped: 0 });
  }

  let created = 0;
  let skipped = 0;

  for (const tmpl of templates) {
    // Idempotency — check if already created this month
    const { count } = await supabase
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .eq("recurring_id", tmpl.id)
      .gte("date", monthStart)
      .lte("date", todayStr);

    if (count && count > 0) {
      skipped++;
      continue;
    }

    // Check free plan limit
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("plan, plan_expires_at, entry_count")
      .eq("user_id", tmpl.user_id)
      .single();

    const FREE_LIMIT = 250;
    const isPro = profile?.plan === "pro" &&
      (!profile.plan_expires_at || new Date(profile.plan_expires_at) > today);
    const atLimit = !isPro && (profile?.entry_count ?? 0) >= FREE_LIMIT;

    if (atLimit) {
      skipped++;
      continue;
    }

    // Insert transaction
    const { data: tx, error: txErr } = await supabase
      .from("transactions")
      .insert({
        user_id:            tmpl.user_id,
        wallet_id:          tmpl.wallet_id   || null,
        category_id:        tmpl.category_id || null,
        amount:             tmpl.amount,
        entry_type:         tmpl.entry_type,
        type:               tmpl.entry_type === "income" ? "credit" : "debit",
        description:        tmpl.description ?? "",
        note:               tmpl.note        || null,
        date:               todayStr,
        is_opening_balance: false,
        recurring_id:       tmpl.id,
      })
      .select("id")
      .single();

    if (txErr) {
      console.error(`[cron/recurring] insert error for template ${tmpl.id}:`, txErr.message);
      continue;
    }

    // Attach labels
    const labelIds: string[] = (tmpl.recurring_transaction_labels ?? []).map(
      (l: { label_id: string }) => l.label_id
    );
    if (labelIds.length > 0 && tx) {
      await supabase.from("transaction_labels").insert(
        labelIds.map((lid) => ({ transaction_id: tx.id, label_id: lid }))
      );
    }

    // Increment entry count
    if (profile) {
      await supabase
        .from("user_profiles")
        .update({
          entry_count: (profile.entry_count ?? 0) + 1,
          updated_at:  new Date().toISOString(),
        })
        .eq("user_id", tmpl.user_id);
    }

    created++;
  }

  console.log(`[cron/recurring] done — created: ${created}, skipped: ${skipped}`);
  return NextResponse.json({ created, skipped });
}
