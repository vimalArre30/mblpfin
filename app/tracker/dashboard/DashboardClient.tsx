"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AddEntryModal from "@/components/tracker/AddEntryModal";
import StatCards from "@/components/tracker/StatCards";
import SpendByCategory, { type CategorySpend } from "@/components/tracker/SpendByCategory";
import MonthlyChart, { type MonthlyDataPoint } from "@/components/tracker/MonthlyChart";
import NeedWantRatio, { type NeedWantData } from "@/components/tracker/NeedWantRatio";
import TransactionFeed, { type Transaction } from "@/components/tracker/TransactionFeed";
import PeriodFilter from "@/components/tracker/PeriodFilter";
import EntryCountPill from "@/components/tracker/EntryCountPill";
import ExpiredBanner from "@/components/tracker/ExpiredBanner";
import HaltedBanner from "@/components/tracker/HaltedBanner";
import type { Wallet } from "@/components/tracker/CreateWalletModal";

interface Props {
  stats: { totalIncome: number; totalExpense: number; netBalance: number; walletCount: number };
  chartData: CategorySpend[];
  monthlyData: MonthlyDataPoint[];
  needWant: NeedWantData;
  transactions: Transaction[];
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
  transactions,
  wallets,
  paywall,
}: Props) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [selectedWalletId, setSelectedWalletId] = useState("all");

  // Period state — initialised to the current month so the first render is stable
  const [periodStart, setPeriodStart] = useState<string>(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1).toISOString().split("T")[0];
  });
  const [periodEnd, setPeriodEnd] = useState<string>(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth() + 1, 0).toISOString().split("T")[0];
  });
  const [periodLabel, setPeriodLabel] = useState<string>(() =>
    new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })
  );

  const handlePeriodChange = useCallback((start: string, end: string, label: string) => {
    setPeriodStart(start);
    setPeriodEnd(end);
    setPeriodLabel(label);
  }, []);

  // All-time, wallet-filtered (for StatCards)
  const walletFiltered = useMemo(
    () =>
      selectedWalletId === "all"
        ? transactions
        : transactions.filter((t) => t.wallet_id === selectedWalletId),
    [transactions, selectedWalletId]
  );

  const filteredStats = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;
    for (const tx of walletFiltered) {
      const amount = Number(tx.amount);
      const entryType = tx.entry_type ?? (tx.type === "credit" ? "income" : "expense");
      if (entryType === "transfer") continue;
      if (entryType === "income") { totalIncome += Math.abs(amount); continue; }
      totalExpense += Math.abs(amount);
    }
    return { totalIncome, totalExpense, netBalance: totalIncome - totalExpense };
  }, [walletFiltered]);

  // Period + wallet filtered (for feed, chart, period stats)
  const periodFiltered = useMemo(
    () => walletFiltered.filter((tx) => tx.date >= periodStart && tx.date <= periodEnd),
    [walletFiltered, periodStart, periodEnd]
  );

  const periodStats = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const tx of periodFiltered) {
      const et = tx.entry_type ?? (tx.type === "credit" ? "income" : "expense");
      if (et === "transfer") continue;
      if (et === "income") income += Math.abs(Number(tx.amount));
      else expense += Math.abs(Number(tx.amount));
    }
    return { income, expense };
  }, [periodFiltered]);

  const periodChartData = useMemo<CategorySpend[]>(() => {
    const totals: Record<string, { name: string; total: number }> = {};
    for (const tx of periodFiltered) {
      const et = tx.entry_type ?? (tx.type === "credit" ? "income" : "expense");
      if (et !== "expense") continue;
      if (tx.categories?.name) {
        const n = tx.categories.name;
        if (!totals[n]) totals[n] = { name: n, total: 0 };
        totals[n].total += Math.abs(Number(tx.amount));
      }
    }
    return Object.values(totals)
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);
  }, [periodFiltered]);

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
              onChange={(e) => setSelectedWalletId(e.target.value)}
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
              onClick={() => setShowModal(true)}
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-navy-dark bg-white rounded-xl px-4 py-2 hover:bg-white/90 transition"
            >
              <span className="text-base leading-none">+</span> Add Entry
            </button>
          </div>
          <TransactionFeed transactions={periodFiltered} wallets={wallets} />
        </section>
      </main>

      <button
        onClick={() => setShowModal(true)}
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
