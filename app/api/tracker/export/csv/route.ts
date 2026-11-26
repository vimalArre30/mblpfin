import { NextRequest, NextResponse } from "next/server";
import { buildCsv } from "@/lib/export/csv";
import { exportFilename, fetchAllRows, prepareExport } from "@/lib/export/rows";

export const runtime = "nodejs";
export const maxDuration = 60;

// GET /api/tracker/export/csv?from=YYYY-MM-DD&to=YYYY-MM-DD[&wallet_id=uuid]
// Free: current financial year only. Anyone: at most 10,000 rows.
export async function GET(req: NextRequest) {
  const ctx = await prepareExport(req, { proOnly: false });
  if (ctx.error) return ctx.error;

  try {
    const rows = await fetchAllRows(ctx);
    return new NextResponse(buildCsv(rows), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${exportFilename(ctx.from, ctx.to, "csv")}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("[export csv]", e);
    return NextResponse.json({ error: "export_failed" }, { status: 500 });
  }
}
