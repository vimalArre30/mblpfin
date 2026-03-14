"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import AddEntryModal from "@/components/tracker/AddEntryModal";
import type { Wallet } from "@/components/tracker/CreateWalletModal";

type TransactionRow = {
  id: string;
  amount: number;
  description: string;
  date: string;
  note: string | null;
  categories: { name: string; icon: string | null } | null;
  wallets: { name: string; emoji: string | null; color: string | null } | null;
};

function formatAmount(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n);
}

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function TransactionsClient({
  initialTransactions,
  wallets,
}: {
  initialTransactions: TransactionRow[];
  wallets: Wallet[];
}) {
  const [transactions, setTransactions] =
    useState<TransactionRow[]>(initialTransactions);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(false);

  const supabase = createClient();

  const refreshTransactions = useCallback(async () => {
    const { data } = await supabase
      .from("transactions")
      .select("*, categories(name, icon), wallets(name, emoji, color)")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setTransactions(data as TransactionRow[]);
  }, [supabase]);

  function handleCreated() {
    setShowModal(false);
    setToast(true);
    setTimeout(() => setToast(false), 3000);
    refreshTransactions();
  }

  return (
    <>
      <main className="max-w-3xl mx-auto px-6 py-12">
        {/* Page title + action */}
        <div className="flex items-start justify-between mb-8 gap-4">
          <div>
            <h1 className="font-playfair text-3xl font-bold text-white">
              Transactions
            </h1>
            <p className="mt-1.5 text-white/45 text-sm">
              {transactions.length === 0
                ? "No entries yet"
                : `${transactions.length} entr${transactions.length !== 1 ? "ies" : "y"}`}
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex-shrink-0 flex items-center gap-1.5 bg-white text-[#0F1E40] text-sm font-semibold rounded-xl px-5 py-2.5 hover:bg-white/90 transition"
          >
            <span className="text-base leading-none">+</span> Add Entry
          </button>
        </div>

        {/* Empty state */}
        {transactions.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-16 text-center">
            <div className="text-5xl mb-5">📋</div>
            <h2 className="font-playfair text-xl font-semibold text-white mb-2">
              No entries yet
            </h2>
            <p className="text-white/40 text-sm mb-6 max-w-xs mx-auto">
              Log your first transaction to start tracking your expenses.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-white text-[#0F1E40] text-sm font-semibold rounded-xl px-6 py-2.5 hover:bg-white/90 transition"
            >
              + Add Entry
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <TransactionRow key={tx.id} tx={tx} />
            ))}
          </div>
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

      {/* Modal */}
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

function TransactionRow({ tx }: { tx: TransactionRow }) {
  const walletColor = tx.wallets?.color ?? "#2563EB";

  return (
    <div
      className="bg-white/5 border border-white/10 rounded-xl px-5 py-4 flex items-center gap-4 hover:bg-white/[0.08] transition"
      style={{ borderLeft: `3px solid ${walletColor}` }}
    >
      {/* Category icon */}
      <div className="text-xl w-8 flex-shrink-0 text-center">
        {tx.categories?.icon ?? "💸"}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate">
          {tx.description}
        </p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {tx.categories?.name && (
            <span className="text-white/40 text-xs">{tx.categories.name}</span>
          )}
          {tx.wallets?.name && (
            <>
              <span className="text-white/20 text-xs">·</span>
              <span className="text-white/40 text-xs">
                {tx.wallets.emoji ?? ""} {tx.wallets.name}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Right side: amount + date */}
      <div className="flex-shrink-0 text-right">
        <p className="text-white font-semibold text-sm">
          {formatAmount(tx.amount)}
        </p>
        <p className="text-white/35 text-xs mt-0.5">{formatDate(tx.date)}</p>
      </div>
    </div>
  );
}
