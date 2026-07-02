"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AddEntryModal from "@/components/tracker/AddEntryModal";
import TransactionFeed, { type Transaction } from "@/components/tracker/TransactionFeed";
import PeriodFilter from "@/components/tracker/PeriodFilter";
import type { Wallet } from "@/components/tracker/CreateWalletModal";
import RecurringSection from "./RecurringSection";

function SkeletonRow() {
  return (
    <div className="animate-pulse bg-white/5 border border-white/8 rounded-xl px-4 py-3 flex items-center gap-3">
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-white/10 rounded w-2/3" />
        <div className="h-2.5 bg-white/8 rounded w-1/3" />
      </div>
      <div className="h-4 bg-white/10 rounded w-16 shrink-0" />
    </div>
  );
}

type Tab = "transactions" | "recurring";

export default function TransactionsClient({
  initialTransactions,
  wallets,
}: {
  initialTransactions: Transaction[];
  wallets: Wallet[];
}) {
  const router = useRouter();
  const supabase = useRef(createClient()).current;
  const [activeTab, setActiveTab] = useState<Tab>("transactions");
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(false);

  const [periodTx, setPeriodTx] = useState<Transaction[] | null>(null);
  const [periodLabel, setPeriodLabel] = useState("");
  const [periodLoading, setPeriodLoading] = useState(true);

  const handlePeriodChange = useCallback(
    async (start: string, end: string, label: string) => {
      setPeriodLabel(label);
      setPeriodLoading(true);
      const { data } = await supabase
        .from("transactions")
        .select(
          "*, categories(name), wallet:wallets!transactions_wallet_id_fkey(name, emoji, color), transaction_labels(label_id, labels(name)), recurring_id"
        )
        .gte("date", start)
        .lte("date", end)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });
      setPeriodTx((data ?? []) as Transaction[]);
      setPeriodLoading(false);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // While the first fetch hasn't completed yet, fall back to the server-provided list
  const transactions = periodTx ?? initialTransactions;

  function handleCreated() {
    setShowModal(false);
    setToast(true);
    setTimeout(() => setToast(false), 3000);
    router.refresh();
  }

  // Render recurring tab
  if (activeTab === "recurring") {
    return (
      <>
        {/* Tab bar */}
        <div className="max-w-3xl mx-auto px-6 pt-12">
          <TabBar active={activeTab} onChange={setActiveTab} />
        </div>
        <RecurringSection wallets={wallets} />
      </>
    );
  }

  return (
    <>
      <main className="max-w-3xl mx-auto px-6 py-12">
        {/* Tab bar */}
        <div className="mb-6">
          <TabBar active={activeTab} onChange={setActiveTab} />
        </div>

        {/* Page title + action */}
        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <h1 className="font-playfair text-3xl font-bold text-white">Transactions</h1>
            {!periodLoading && (
              <p className="mt-1.5 text-white/45 text-sm">
                {transactions.length === 0
                  ? `No entries in ${periodLabel}`
                  : `${transactions.length} entr${transactions.length !== 1 ? "ies" : "y"}`}
              </p>
            )}
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex-shrink-0 flex items-center gap-1.5 bg-white text-[#0F1E40] text-sm font-semibold rounded-xl px-5 py-2.5 hover:bg-white/90 transition"
          >
            <span className="text-base leading-none">+</span> Add Entry
          </button>
        </div>

        {/* Period filter */}
        <div className="mb-6">
          <PeriodFilter onChange={handlePeriodChange} />
        </div>

        {/* Content */}
        {periodLoading ? (
          <div className="space-y-2">
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </div>
        ) : transactions.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-16 text-center">
            <div className="text-5xl mb-5">📋</div>
            <h2 className="font-playfair text-xl font-semibold text-white mb-2">
              No transactions in {periodLabel}
            </h2>
            <p className="text-white/40 text-sm mb-6 max-w-xs mx-auto">
              Try a different period or log a new entry.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-white text-[#0F1E40] text-sm font-semibold rounded-xl px-6 py-2.5 hover:bg-white/90 transition"
            >
              + Add Entry
            </button>
          </div>
        ) : (
          <>
            <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-4">
              {periodLabel}
            </p>
            <TransactionFeed transactions={transactions} wallets={wallets} />
          </>
        )}
      </main>

      {/* Floating Add button (mobile) */}
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-6 right-6 sm:hidden w-14 h-14 bg-white text-[#0F1E40] rounded-full shadow-2xl text-2xl font-bold flex items-center justify-center hover:bg-white/90 transition active:scale-95"
        aria-label="Add Entry"
      >
        +
      </button>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-green-500 text-white text-sm font-medium px-5 py-2.5 rounded-full shadow-lg z-50 pointer-events-none animate-fade-in">
          Entry logged
        </div>
      )}

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

function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const tabs: { id: Tab; label: string }[] = [
    { id: "transactions", label: "Transactions" },
    { id: "recurring",    label: "🔁 Recurring" },
  ];
  return (
    <div className="flex gap-1 bg-white/[0.04] border border-white/[0.08] rounded-xl p-1 w-fit">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`font-inter text-sm px-4 py-1.5 rounded-lg transition-colors ${
            active === t.id
              ? "bg-white text-[#0A1628] font-semibold"
              : "text-white/45 hover:text-white/70"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
