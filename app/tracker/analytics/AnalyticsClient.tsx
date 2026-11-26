"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTrackerChanged } from "@/lib/tracker/changed";
import { fetchTotals, monthLabel } from "@/lib/tracker/totals-client";
import type { TotalsResponse } from "@/lib/tracker/totals-types";
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
import { track } from "@/lib/analytics/track";
import AddEntryModal from "@/components/tracker/AddEntryModal";
import type { Wallet } from "@/components/tracker/CreateWalletModal";

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
  const [totals, setTotals] = useState<TotalsResponse | null>(null);
  const [insight, setInsight] = useState<string | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const insightFetchedForPeriod = useRef<string | null>(null);

  const lastPeriod = useRef<{ start: string; end: string; label: string } | null>(null);

  const handlePeriodChange = useCallback(
    async (start: string, end: string, label: string) => {
      lastPeriod.current = { start, end, label };
      setPeriodLabel(label);
      setLoading(true);
      // All figures are computed in SQL (migration 008); nothing is summed here.
      let t: TotalsResponse | null = null;
      try {
        t = await fetchTotals({
          from: start,
          to: end,
          include: ["by_category", "labels", "monthly"],
          monthly: "period",
        });
      } catch {
        t = null;
      }
      setTotals(t);
      setLoading(false);

      if (insightFetchedForPeriod.current !== label) {
        insightFetchedForPeriod.current = label;
        setInsight(null);
        setInsightLoading(true);

        try {
          const session = await supabase.auth.getSession();
          const token = session.data.session?.access_token;
          if (!token) return;

          const summary = {
            period: label,
            totalExpense: t?.expense ?? 0,
            topCategories: (t?.by_category ?? []).slice(0, 5).map((c) => ({
              name: c.name,
              total: c.total,
            })),
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

  // Entry added/edited/deleted from anywhere on the page -> reload this period's figures.
  useTrackerChanged(() => {
    const p = lastPeriod.current;
    if (p) void handlePeriodChange(p.start, p.end, p.label);
  });

  // GA4: the AI insight card rendered
  useEffect(() => {
    if (insight) track("ai_insight_view");
  }, [insight]);

  const analytics = useMemo(() => {
    const chartData: CategorySpend[] = (totals?.by_category ?? [])
      .filter((c) => c.category_id !== null)
      .slice(0, 6)
      .map((c) => ({ name: c.name, total: c.total }));

    const monthlyData: MonthlyDataPoint[] = (totals?.monthly ?? [])
      .filter((m) => m.expense > 0)
      .map((m) => ({ month: monthLabel(m.month), total: m.expense }));

    const labelTotal = (n: string) =>
      (totals?.labels ?? []).find((l) => l.name === n)?.total ?? 0;
    const needWant: NeedWantData = { needTotal: labelTotal("Need"), wantTotal: labelTotal("Want") };

    return {
      totalSpent: totals?.expense ?? 0,
      expenseCount: totals?.expense_count ?? 0,
      chartData,
      monthlyData,
      needWant,
    };
  }, [totals]);

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
              <div data-ga-hover="chart_hover" data-ga-chart-type="need_vs_want">
                <NeedWantRatio
                  needTotal={analytics.needWant.needTotal}
                  wantTotal={analytics.needWant.wantTotal}
                />
              </div>
            </div>
          </>
        )}
      </main>

      {/* FAB */}
      <button
        data-ga="add_entry_click" data-ga-cta-location="analytics" onClick={() => setShowModal(true)}
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
