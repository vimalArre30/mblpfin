"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SpendByCategory, {
  type CategorySpend,
} from "@/components/tracker/SpendByCategory";
import MonthlyChart, {
  type MonthlyDataPoint,
} from "@/components/tracker/MonthlyChart";
import NeedWantRatio, {
  type NeedWantData,
} from "@/components/tracker/NeedWantRatio";
import AddEntryModal from "@/components/tracker/AddEntryModal";
import type { Wallet } from "@/components/tracker/CreateWalletModal";

interface Props {
  chartData: CategorySpend[];
  monthlyData: MonthlyDataPoint[];
  needWant: NeedWantData;
  totalSpent: number;
  txCount: number;
  wallets: Wallet[];
}

export default function AnalyticsClient({
  chartData,
  monthlyData,
  needWant,
  totalSpent,
  txCount,
  wallets,
}: Props) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

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
          <p className="mt-1 text-white/40 text-sm">
            {txCount} transaction{txCount !== 1 ? "s" : ""} ·{" "}
            ₹{totalSpent.toLocaleString("en-IN", { maximumFractionDigits: 0 })} total
          </p>
        </div>

        {/* Monthly trend */}
        <MonthlyChart data={monthlyData} />

        {/* Category + Need/Want side by side on lg */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SpendByCategory data={chartData} />
          <NeedWantRatio
            needTotal={needWant.needTotal}
            wantTotal={needWant.wantTotal}
          />
        </div>
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
