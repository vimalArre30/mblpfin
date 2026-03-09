import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/app/tracker/dashboard/SignOutButton";
import AnalyticsClient from "./AnalyticsClient";
import type { CategorySpend } from "@/components/tracker/SpendByCategory";
import type { MonthlyDataPoint } from "@/components/tracker/MonthlyChart";
import type { NeedWantData } from "@/components/tracker/NeedWantRatio";

export const metadata = {
  title: "Analytics — MrBottomLine Tracker",
};

export default async function AnalyticsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/tracker/login");

  const { data: rawTx } = await supabase
    .from("transactions")
    .select("amount, date, type, categories(name), transaction_labels(labels(name))")
    .order("date", { ascending: false });

  const transactions = rawTx ?? [];

  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
    .toISOString()
    .split("T")[0];

  let totalSpent = 0;
  let needTotal = 0;
  let wantTotal = 0;

  const categoryTotals: Record<string, { name: string; total: number }> = {};
  const monthlyMap: Record<string, { month: string; total: number }> = {};

  for (const tx of transactions) {
    const amount = Number(tx.amount);
    if ((tx as any).type === "credit") continue;

    totalSpent += amount;

    const catName = (tx as any).categories?.name as string | undefined;
    if (catName) {
      if (!categoryTotals[catName]) categoryTotals[catName] = { name: catName, total: 0 };
      categoryTotals[catName].total += amount;
    }

    if (tx.date >= sixMonthsAgo) {
      const d = new Date(tx.date + "T00:00:00");
      const sortKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const month = d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
      if (!monthlyMap[sortKey]) monthlyMap[sortKey] = { month, total: 0 };
      monthlyMap[sortKey].total += amount;
    }

    const labelNames = ((tx as any).transaction_labels ?? [])
      .map((tl: any) => tl.labels?.name)
      .filter(Boolean) as string[];
    if (labelNames.includes("Need")) needTotal += amount;
    if (labelNames.includes("Want")) wantTotal += amount;
  }

  const chartData: CategorySpend[] = Object.values(categoryTotals)
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);

  const monthlyData: MonthlyDataPoint[] = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v);

  const needWant: NeedWantData = { needTotal, wantTotal };

  return (
    <div className="min-h-screen bg-navy-dark font-inter">
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-playfair text-lg font-semibold text-white tracking-tight">
            Mr. Bottom Line
          </span>
          <span className="text-white/25 text-sm">/</span>
          <span className="text-white/60 text-sm">Tracker</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-white/35 hidden sm:block">
            {user.email ?? ""}
          </span>
          <SignOutButton />
        </div>
      </header>

      <AnalyticsClient
        chartData={chartData}
        monthlyData={monthlyData}
        needWant={needWant}
        totalSpent={totalSpent}
        txCount={transactions.length}
      />
    </div>
  );
}
