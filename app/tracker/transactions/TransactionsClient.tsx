"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AddEntryModal from "@/components/tracker/AddEntryModal";
import TransactionFeed, { type Transaction } from "@/components/tracker/TransactionFeed";
import type { Wallet } from "@/components/tracker/CreateWalletModal";

export default function TransactionsClient({
  initialTransactions,
  wallets,
}: {
  initialTransactions: Transaction[];
  wallets: Wallet[];
}) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(false);

  const transactions = initialTransactions;

  function handleCreated() {
    setShowModal(false);
    setToast(true);
    setTimeout(() => setToast(false), 3000);
    router.refresh();
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
          <TransactionFeed transactions={transactions} wallets={wallets} />
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
