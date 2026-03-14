import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "./SignOutButton";
import DashboardClient from "./DashboardClient";
import type { CategorySpend } from "@/components/tracker/SpendByCategory";
import type { MonthlyDataPoint } from "@/components/tracker/MonthlyChart";
import type { NeedWantData } from "@/components/tracker/NeedWantRatio";
import type { Transaction } from "@/components/tracker/TransactionFeed";

export const metadata = {
  title: "Dashboard — MrBottomLine Tracker",
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/tracker/login");

  // Fetch transactions with joined data (including destination wallet for transfers)
  const { data: rawTransactions } = await supabase
    .from("transactions")
    .select(
      `
      *,
      wallets(name, emoji, color),
      categories(name),
      transaction_labels(labels(name))
    `
    )
    .order("date", { ascending: false });

  const transactions: Transaction[] = (rawTransactions ?? []) as Transaction[];

  // Fetch wallets for AddEntryModal + transfer destination lookup
  const { data: wallets } = await supabase
    .from("wallets")
    .select("id, name, emoji, color, created_at")
    .order("created_at", { ascending: true });

  // --- Compute stats ---
  const now = new Date();

  let totalIncome = 0;
  let totalExpense = 0;
  let needTotal = 0;
  let wantTotal = 0;

  const categoryTotals: Record<string, { name: string; total: number }> = {};
  const monthlyMap: Record<string, { month: string; total: number }> = {};

  // Six months ago, first day
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
    .toISOString()
    .split("T")[0];

  for (const tx of transactions) {
    const amount = Number(tx.amount);
    const entryType = tx.entry_type ?? (tx.type === "credit" ? "income" : "expense");

    // Skip transfers entirely — they don't count toward income or expense
    if (entryType === "transfer") continue;

    if (entryType === "income") {
      totalIncome += Math.abs(amount);
      continue;
    }

    // Expense
    totalExpense += Math.abs(amount);

    // Category totals (expenses only)
    if (tx.categories?.name) {
      const n = tx.categories.name;
      if (!categoryTotals[n]) categoryTotals[n] = { name: n, total: 0 };
      categoryTotals[n].total += Math.abs(amount);
    }

    // Monthly totals — last 6 months (expenses only)
    if (tx.date >= sixMonthsAgo) {
      const d = new Date(tx.date + "T00:00:00");
      const sortKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const month = d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
      if (!monthlyMap[sortKey]) monthlyMap[sortKey] = { month, total: 0 };
      monthlyMap[sortKey].total += Math.abs(amount);
    }

    // Need vs Want (expenses only)
    const labelNames =
      tx.transaction_labels
        ?.map((tl) => tl.labels?.name)
        .filter((n): n is string => Boolean(n)) ?? [];
    if (labelNames.includes("Need")) needTotal += Math.abs(amount);
    if (labelNames.includes("Want")) wantTotal += Math.abs(amount);
  }

  const netBalance = totalIncome - totalExpense;

  const chartData: CategorySpend[] = Object.values(categoryTotals)
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);

  const monthlyData: MonthlyDataPoint[] = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v);

  const needWant: NeedWantData = { needTotal, wantTotal };
  const walletCount = wallets?.length ?? 0;

  return (
    <div className="min-h-screen bg-navy-dark font-inter">
      {/* Top bar */}
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
            {user.email ?? user.phone ?? "Your account"}
          </span>
          <SignOutButton />
        </div>
      </header>

      <DashboardClient
        stats={{ totalIncome, totalExpense, netBalance, walletCount }}
        chartData={chartData}
        monthlyData={monthlyData}
        needWant={needWant}
        transactions={transactions}
        wallets={wallets ?? []}
      />
    </div>
  );
}
