"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import SpendByCategory, {
  type CategorySpend,
} from "@/components/tracker/SpendByCategory";
import MonthlyChart, {
  type MonthlyDataPoint,
} from "@/components/tracker/MonthlyChart";
import NeedWantRatio, {
  type NeedWantData,
} from "@/components/tracker/NeedWantRatio";
import PeriodFilter from "@/components/tracker/PeriodFilter";
import AddEntryModal from "@/components/tracker/AddEntryModal";
import type { Wallet } from "@/components/tracker/CreateWalletModal";

type RawTx = {
  amount: number;
  date: string;
  type: string;
  entry_type: string | null;
  categories: { name: string } | null;
  transaction_labels: { labels: { name: string } | null }[] | null;
};

function ChartSkeleton() {
  return (
    <div className="animate-pulse bg-white/5 border border-white/10 rounded-2xl h-48" />
  );
}

export default function AnalyticsClient({ wallets }: { wallets: Wallet[] }) {
  const router = useRouter();
  const supabase = useRef(createClient()).current;
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [periodLabel, setPeriodLabel] = useState("");
  const [txs, setTxs] = useState<RawTx[]>([]);
  const [insight, setInsight] = useState<string | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const insightFetchedForPeriod = useRef<string | null>(null);

  const handlePeriodChange = useCallback(
    async (start: string, end: string, label: string) => {
      setPeriodLabel(label);
      setLoading(true);
      const { data } = await supabase
        .from("transactions")
        .select(
          "amount, date, type, entry_type, categories(name), transaction_labels(labels(name))"
        )
        .gte("date", start)
        .lte("date", end)
        .order("date", { ascending: false });
      setTxs((data ?? []) as unknown as RawTx[]);
      setLoading(false);

      if (insightFetchedForPeriod.current !== label) {
        insightFetchedForPeriod.current = label;
        setInsight(null);
        setInsightLoading(true);

        try {
          const session = await supabase.auth.getSession();
          const token = session.data.session?.access_token;
          if (!token) return;

          let totalExp = 0;
          const catTotals: Record<string, number> = {};
          for (const tx of (data ?? []) as unknown as RawTx[]) {
            const entryType =
              tx.entry_type ?? (tx.type === "credit" ? "income" : "expense");
            if (entryType !== "expense") continue;
            const amt = Math.abs(Number(tx.amount));
            totalExp += amt;
            const catName = tx.categories?.name ?? "Uncategorised";
            catTotals[catName] = (catTotals[catName] ?? 0) + amt;
          }

          const summary = {
            period: label,
            totalExpense: totalExp,
            topCategories: Object.entries(catTotals)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([name, total]) => ({ name, total })),
          };

          const res = await fetch("/api/tracker/insights", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              type: "wallet",
              walletName: "All Wallets",
              data: summary,
            }),
          });

          if (res.ok) {
            const json = await res.json();
            setInsight(json.insight ?? null);
          }
        } catch {
          // silent fail — insight is non-critical
        } finally {
          setInsightLoading(false);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const analytics = useMemo(() => {
    let totalSpent = 0;
    let expenseCount = 0;
    let needTotal = 0;
    let wantTotal = 0;
    const categoryTotals: Record<string, { name: string; total: number }> = {};
    const monthlyMap: Record<string, { month: string; total: number }> = {};

    for (const tx of txs) {
      const entryType =
        tx.entry_type ?? (tx.type === "credit" ? "income" : "expense");
      if (entryType !== "expense") continue;

      const amount = Math.abs(Number(tx.amount));
      totalSpent += amount;
      expenseCount++;

      if (tx.categories?.name) {
        const n = tx.categories.name;
        if (!categoryTotals[n]) categoryTotals[n] = { name: n, total: 0 };
        categoryTotals[n].total += amount;
      }

      const d = new Date(tx.date + "T00:00:00");
      const sortKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const month = d.toLocaleDateString("en-IN", {
        month: "short",
        year: "numeric",
      });
      if (!monthlyMap[sortKey]) monthlyMap[sortKey] = { month, total: 0 };
      monthlyMap[sortKey].total += amount;

      const labelNames = (tx.transaction_labels ?? [])
        .map((tl) => tl.labels?.name)
        .filter((n): n is string => Boolean(n));
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

    return { totalSpent, expenseCount, chartData, monthlyData, needWant };
  }, [txs]);

  function handleCreated() {
    setShowModal(false);
    router.refresh();
  }

  return (
    <>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 pb-16 space-y-8">
        <div>
          <h1 className="font-playfair text-2xl font-bold text-white">
            Analytics
          </h1>
          {!loading && (
            <p className="mt-1 text-white/40 text-sm">
              {analytics.expenseCount} expense
              {analytics.expenseCount !== 1 ? "s" : ""} ·{" "}
              ₹
              {analytics.totalSpent.toLocaleString("en-IN", {
                maximumFractionDigits: 0,
              })}{" "}
              total · {periodLabel}
            </p>
          )}
        </div>

        <PeriodFilter onChange={handlePeriodChange} />

        {loading ? (
          <div className="space-y-6">
            <ChartSkeleton />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartSkeleton />
              <ChartSkeleton />
            </div>
          </div>
        ) : (
          <>
            {/* AI Insight Card */}
            {insightLoading && (
              <div className="animate-pulse bg-white/5 border border-white/10 rounded-2xl p-4 h-16" />
            )}
            {!insightLoading && insight && (
              <div className="bg-[#3B5998]/20 border border-[#3B5998]/40 rounded-2xl px-5 py-4 flex gap-3 items-start">
                <span className="text-lg leading-none mt-0.5">✨</span>
                <p className="text-white/80 text-sm leading-relaxed">{insight}</p>
              </div>
            )}
            <MonthlyChart data={analytics.monthlyData} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SpendByCategory data={analytics.chartData} />
              <NeedWantRatio
                needTotal={analytics.needWant.needTotal}
                wantTotal={analytics.needWant.wantTotal}
              />
            </div>
          </>
        )}
      </main>

      {/* FAB */}
      <button
        onClick={() => setShowModal(true)}
        className="sm:hidden fixed bottom-6 right-5 z-40 flex items-center gap-2 bg-white text-navy-dark font-semibold text-sm rounded-2xl px-5 py-3 shadow-lg shadow-black/40 hover:bg-white/90 transition"
        aria-label="Add Entry"
      >
        <span className="text-lg leading-none">+</span> Add Entry
      </button>

      {showModal && (
        <AddEntryModal
          wallets={wallets}
          onCreated={handleCreated}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
