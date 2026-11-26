import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { StatementDocument } from "@/lib/pdf/StatementDocument";
import { exportFilename, fetchAllRows, monthSummaries, prepareExport } from "@/lib/export/rows";
import { getUserPlan } from "@/lib/tracker/plan";

export const runtime = "nodejs";
export const maxDuration = 60;

// GET /api/tracker/export/pdf?from=YYYY-MM-DD&to=YYYY-MM-DD[&wallet_id=uuid]
// Same rules as the CSV: Free = current financial year only, Pro = any range,
// max 10,000 rows. Summary tiles and the category table come from the same SQL as the
// dashboard (totals_for_period / spend_by_category).
export async function GET(req: NextRequest) {
  const ctx = await prepareExport(req, { proOnly: false, withCategories: true });
  if (ctx.error) return ctx.error;

  try {
    const [rows, months, profile, wallet] = await Promise.all([
      fetchAllRows(ctx),
      monthSummaries(ctx),
      getUserPlan(ctx.supabase, ctx.user.id),
      ctx.walletId
        ? ctx.supabase.from("wallets").select("name").eq("id", ctx.walletId).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    const generatedOn = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
    const buf = await renderToBuffer(
      StatementDocument({
        rows,
        totals: ctx.totals,
        from: ctx.from,
        to: ctx.to,
        userName: profile?.name ?? "",
        userPhone: ctx.user.phone || (ctx.user.user_metadata?.phone as string | undefined) || null,
        months,
        walletName: (wallet.data as { name: string } | null)?.name ?? null,
        generatedOn,
      })
    );

    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${exportFilename(ctx.from, ctx.to, "pdf")}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("[export pdf]", e);
    return NextResponse.json({ error: "export_failed" }, { status: 500 });
  }
}
