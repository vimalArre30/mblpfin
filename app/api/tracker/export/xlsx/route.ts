import { NextRequest, NextResponse } from "next/server";
import { buildXlsx, type XlsxWallet } from "@/lib/export/xlsx";
import { exportFilename, fetchAllRows, prepareExport } from "@/lib/export/rows";
import { getTotals } from "@/lib/tracker/totals";
import { getUserPlan } from "@/lib/tracker/plan";

export const runtime = "nodejs";
export const maxDuration = 60;

/** The calendar day before an ISO date (YYYY-MM-DD). */
function dayBefore(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d - 1)).toISOString().slice(0, 10);
}

// GET /api/tracker/export/xlsx?from=YYYY-MM-DD&to=YYYY-MM-DD[&wallet_id=uuid]
// Same rules as CSV/PDF: Free = current financial year only, Pro = any range,
// max 10,000 rows. Summary tab + one tab per wallet + all transactions, with charts.
export async function GET(req: NextRequest) {
  const ctx = await prepareExport(req, { proOnly: false });
  if (ctx.error) return ctx.error;

  try {
    let walletsQuery = ctx.supabase.from("wallets").select("id, name").order("created_at", { ascending: true });
    if (ctx.walletId) walletsQuery = walletsQuery.eq("id", ctx.walletId);

    const [rows, profile, walletsRes] = await Promise.all([
      fetchAllRows(ctx),
      getUserPlan(ctx.supabase, ctx.user.id),
      walletsQuery,
    ]);
    if (walletsRes.error) throw new Error(`wallets: ${walletsRes.error.message}`);

    // Balance of each wallet before the period starts (same SQL as the app).
    const before = dayBefore(ctx.from);
    const wallets = (walletsRes.data ?? []) as { id: string; name: string }[];
    const forwarded = await Promise.all(
      wallets.map((w) => getTotals(ctx.supabase, { from: null, to: before, walletId: w.id }).then((t) => t.balance))
    );

    const used = new Set(rows.map((r) => r.wallet_id ?? "none"));
    const tabs: XlsxWallet[] = wallets
      .map((w, i) => ({ id: w.id, name: w.name, broughtForward: forwarded[i] }))
      .filter((w) => used.has(w.id) || Math.abs(w.broughtForward) >= 0.005);
    if (!ctx.walletId && used.has("none")) tabs.push({ id: null, name: "No wallet", broughtForward: 0 });

    const generatedOn = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
    const buf = await buildXlsx({
      rows,
      wallets: tabs,
      from: ctx.from,
      to: ctx.to,
      userName: profile?.name ?? "",
      generatedOn,
    });

    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${exportFilename(ctx.from, ctx.to, "xlsx")}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("[export xlsx]", e);
    return NextResponse.json({ error: "export_failed" }, { status: 500 });
  }
}
