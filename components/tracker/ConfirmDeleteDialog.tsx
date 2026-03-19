"use client";

import { useEffect } from "react";
import type { Transaction } from "./TransactionFeed";

export default function ConfirmDeleteDialog({
  tx,
  onCancel,
  onConfirm,
}: {
  tx: Transaction;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  // Escape key to cancel
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const entryType = tx.entry_type ?? (tx.type === "credit" ? "income" : "expense");
  const isTransfer = entryType === "transfer";
  const absAmount = Math.abs(Number(tx.amount));
  const formattedAmount = absAmount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const label = isTransfer ? "Transfer" : tx.description;
  const summary = `${label} · ₹${formattedAmount}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm bg-navy-dark border border-white/15 rounded-2xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold text-white mb-2">
          Delete Transaction?
        </h2>
        <p className="text-sm text-white/60 mb-1">{summary}</p>
        {isTransfer && (
          <p className="text-xs text-amber-400/80 mt-2">
            This is a transfer. Both legs (debit + credit) will be deleted.
          </p>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-white/15 text-sm font-medium text-white/70 hover:bg-white/5 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 transition text-sm font-semibold text-white"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
