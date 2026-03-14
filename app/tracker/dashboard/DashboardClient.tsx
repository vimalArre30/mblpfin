"use client";

import { useState } from "react";
import AddEntryModal from "@/components/tracker/AddEntryModal";
import StatCards from "@/components/tracker/StatCards";
import SpendByCategory, {
  type CategorySpend,
} from "@/components/tracker/SpendByCategory";
import MonthlyChart, {
  type MonthlyDataPoint,
} from "@/components/tracker/MonthlyChart";
import NeedWantRatio, {
  type NeedWantData,
} from "@/components/tracker/NeedWantRatio";
import TransactionFeed, {
  type Transaction,
} from "@/components/tracker/TransactionFeed";
import type { Wallet } from "@/components/tracker/CreateWalletModal";

interface Props {
  stats: { totalIncome: number; totalExpense: number; netBalance: number; walletCount: number };
  chartData: CategorySpend[];
  monthlyData: MonthlyDataPoint[];
  needWant: NeedWantData;
  transactions: Transaction[];
  wallets: Wallet[];
}

export default function DashboardClient({
  stats,
  chartData,
  monthlyData,
  needWant,
  transactions,
  wallets,
}: Props) {
  const [showModal, setShowModal] = useState(false);

  function handleCreated() {
    setShowModal(false);
    window.location.reload();
  }

  return (
    <>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 pb-24 space-y-8">
        <StatCards
          totalIncome={stats.totalIncome}
          totalExpense={stats.totalExpense}
          netBalance={stats.netBalance}
          walletCount={stats.walletCount}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SpendByCategory data={chartData} />
          <MonthlyChart data={monthlyData} />
        </div>

        <NeedWantRatio
          needTotal={needWant.needTotal}
          wantTotal={needWant.wantTotal}
        />

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
          <TransactionFeed transactions={transactions} wallets={wallets} />
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
