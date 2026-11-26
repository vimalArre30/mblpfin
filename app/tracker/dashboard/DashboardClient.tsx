"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AddEntryModal from "@/components/tracker/AddEntryModal";
import StatCards from "@/components/tracker/StatCards";
import SpendByCategory, { type CategorySpend } from "@/components/tracker/SpendByCategory";
import MonthlyChart, { type MonthlyDataPoint } from "@/components/tracker/MonthlyChart";
import NeedWantRatio, { type NeedWantData } from "@/components/tracker/NeedWantRatio";
import TransactionFeed from "@/components/tracker/TransactionFeed";
import LoadMoreFooter from "@/components/tracker/LoadMoreFooter";
import PeriodFilter from "@/components/tracker/PeriodFilter";
import EntryCountPill from "@/components/tracker/EntryCountPill";
import ExpiredBanner from "@/components/tracker/ExpiredBanner";
import HaltedBanner from "@/components/tracker/HaltedBanner";
import type { Wallet } from "@/components/tracker/CreateWalletModal";
import { toLocalISO } from "@/lib/tracker/dates";
import { useTrackerChanged } from "@/lib/tracker/changed";
import { fetchTotals } from "@/lib/tracker/totals-client";
import { usePagedTransactions } from "@/lib/tracker/usePagedTransactions";
import type { TotalsResponse } from "@/lib/tracker/totals-types";
import { track } from "@/lib/analytics/track";

interface Props {
  stats: { totalIncome: number; totalExpense: number; netBalance: number; walletCount: number };
  monthlyData: MonthlyDataPoint[];
  needWant: NeedWantData;
  wallets: Wallet[];
  paywall: {
    entryCount: number;
    proActive: boolean;
    isHalted: boolean;
    showExpiredBanner: boolean;
    planExpiresAt: string | null;
  };
}

function fmt(n: number) {
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function DashboardClient({
  stats,
  monthlyData,
  needWant,
  wallets,
  paywall,
}: Props) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [showUpgradedBanner, setShowUpgradedBanner] = useState(false);

  // Show success banner when redirected back from Razorpay with ?upgraded=true,
  // then immediately clear the param so it does not persist on refresh.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("upgraded") === "true") {
      setShowUpgradedBanner(true);
      router.replace("/tracker/dashboard", { scroll: false });
      // Delay refresh so the webhook has time to update user_profiles before
      // server components re-fetch — this hides the Upgrade pill in the nav.
      const t = setTimeout(() => router.refresh(), 3000);
      return () => clearTimeout(t);
    }
  }, [router]);
  const [selectedWalletId, setSelectedWalletId] = useState("all");

  // Period state — initialised to the current month so the first render is stable
  const [periodStart, setPeriodStart] = useState<string>(() => {
    const n = new Date();
    return toLocalISO(new Date(n.getFullYear(), n.getMonth(), 1));
  });
  const [periodEnd, setPeriodEnd] = useState<string>(() => {
    const n = new Date();
    return toLocalISO(new Date(n.getFullYear(), n.getMonth() + 1, 0));
  });
  const [periodLabel, setPeriodLabel] = useState<string>(() =>
    new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })
  );

  const handlePeriodChange = useCallback((start: string, end: string, label: string) => {
    setPeriodStart(start);
    setPeriodEnd(end);
    setPeriodLabel(label);
  }, []);

  // Bumped after any add/edit/delete so client-fetched figures and the feed reload.
  const [refreshKey, setRefreshKey] = useState(0);
  useTrackerChanged(() => setRefreshKey((k) => k + 1));

  // All-time stat cards. "All wallets" comes from the server render (props.stats);
  // a single wallet is fetched from /api/tracker/totals. Computed in SQL.
  const [walletAllTime, setWalletAllTime] = useState<TotalsResponse | null>(null);
  useEffect(() => {
    if (selectedWalletId === "all") return;
    let cancelled = false;
    fetchTotals({ walletId: selectedWalletId })
      .then((t) => { if (!cancelled) setWalletAllTime(t); })
      .catch(() => { if (!cancelled) setWalletAllTime(null); });
    return () => { cancelled = true; };
  }, [selectedWalletId, refreshKey]);

  const filteredStats =
    selectedWalletId === "all"
      ? { totalIncome: stats.totalIncome, totalExpense: stats.totalExpense, netBalance: stats.netBalance }
      : {
          totalIncome: walletAllTime?.income ?? 0,
          totalExpense: walletAllTime?.expense ?? 0,
          netBalance: walletAllTime?.net ?? 0,
        };

  // Period (+ wallet) figures and the category chart, also from SQL.
  const [periodTotals, setPeriodTotals] = useState<TotalsResponse | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetchTotals({
      from: periodStart,
      to: periodEnd,
      walletId: selectedWalletId === "all" ? null : selectedWalletId,
      include: ["by_category"],
      categoryTop: 6,
    })
      .then((t) => { if (!cancelled) setPeriodTotals(t); })
      .catch(() => { if (!cancelled) setPeriodTotals(null); });
    return () => { cancelled = true; };
  }, [periodStart, periodEnd, selectedWalletId, refreshKey]);

  const periodStats = { income: periodTotals?.income ?? 0, expense: periodTotals?.expense ?? 0 };
  const periodChartData = useMemo<CategorySpend[]>(
    () =>
      (periodTotals?.by_category ?? [])
        .filter((c) => c.category_id !== null)
        .map((c) => ({ name: c.name, total: c.total })),
    [periodTotals]
  );

  // Period + wallet feed, keyset-paged 50 at a time.
  const feedFilters = useMemo(
    () => ({
      from: periodStart,
      to: periodEnd,
      walletId: selectedWalletId === "all" ? null : selectedWalletId,
    }),
    [periodStart, periodEnd, selectedWalletId]
  );
  const feed = usePagedTransactions(feedFilters);

  function handleCreated() {
    setShowModal(false);
    router.refresh();
  }

  return (
    <>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 pb-24 space-y-8">
        {/* Paywall banners — top of dashboard, ordered by severity */}
        {paywall.isHalted && <HaltedBanner />}
        {paywall.showExpiredBanner && (
          <ExpiredBanner planExpiresAt={paywall.planExpiresAt} />
        )}
        {!paywall.proActive && !paywall.isHalted && (
          <div className="flex justify-end">
            <EntryCountPill entryCount={paywall.entryCount} />
          </div>
        )}

        {/* Wallet filter */}
        {wallets.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-white/40 uppercase tracking-wider shrink-0">
              Wallet
            </span>
            <select
              value={selectedWalletId}
              onChange={(e) => {
                const id = e.target.value;
                setSelectedWalletId(id);
                track("wallet_filter_change", {
                  wallet_id: id,
                  wallet_name: id === "all" ? "All Wallets" : wallets.find((w) => w.id === id)?.name,
                });
              }}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30 transition cursor-pointer"
            >
              <option value="all">All Wallets</option>
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.emoji} {w.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* All-time stat cards */}
        <StatCards
          totalIncome={filteredStats.totalIncome}
          totalExpense={filteredStats.totalExpense}
          netBalance={filteredStats.netBalance}
          walletCount={stats.walletCount}
        />

        {/* Period filter */}
        <PeriodFilter onChange={handlePeriodChange} />

        {/* This Period summary */}
        <div className="grid grid-cols-2 gap-3 -mt-4">
          <div className="bg-white/[0.04] border border-white/8 rounded-xl px-4 py-3">
            <p className="text-xs text-white/35 uppercase tracking-wider mb-1 truncate">
              {periodLabel} · Income
            </p>
            <p className="text-green-400 font-bold text-lg truncate">{fmt(periodStats.income)}</p>
          </div>
          <div className="bg-white/[0.04] border border-white/8 rounded-xl px-4 py-3">
            <p className="text-xs text-white/35 uppercase tracking-wider mb-1 truncate">
              {periodLabel} · Expense
            </p>
            <p className="text-red-400 font-bold text-lg truncate">{fmt(periodStats.expense)}</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SpendByCategory data={periodChartData} />
          <MonthlyChart data={monthlyData} />
        </div>

        <NeedWantRatio needTotal={needWant.needTotal} wantTotal={needWant.wantTotal} />

        {/* Transaction feed — period + wallet filtered */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-medium text-white/40 uppercase tracking-wider">
              Transaction Feed
            </h2>
            <button
              data-ga="add_entry_click" data-ga-cta-location="dashboard" onClick={() => setShowModal(true)}
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-navy-dark bg-white rounded-xl px-4 py-2 hover:bg-white/90 transition"
            >
              <span className="text-base leading-none">+</span> Add Entry
            </button>
          </div>
          {feed.loading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="animate-pulse bg-white/5 border border-white/8 rounded-xl h-14" />
              ))}
            </div>
          ) : (
          <TransactionFeed
            transactions={feed.rows}
            wallets={wallets}
            analyticsSource="dashboard_feed"
          />
          )}
          <LoadMoreFooter
            shown={feed.rows.length}
            total={feed.total}
            hasMore={feed.hasMore}
            loading={feed.loadingMore}
            onLoadMore={feed.loadMore}
          />
        </section>
      </main>

      <button
        data-ga="add_entry_click" data-ga-cta-location="dashboard" onClick={() => setShowModal(true)}
        className="sm:hidden fixed bottom-6 right-5 z-40 flex items-center gap-2 bg-white text-navy-dark font-semibold text-sm rounded-2xl px-5 py-3 shadow-lg shadow-black/40 hover:bg-white/90 transition"
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
