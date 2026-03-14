"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Wallet } from "./CreateWalletModal";

export interface Transaction {
  id: string;
  wallet_id: string | null;
  amount: number;
  description: string;
  date: string;
  type: string;
  entry_type: string | null;
  is_opening_balance: boolean | null;
  transfer_id: string | null;
  to_wallet_id: string | null;
  wallet: { name: string; emoji: string; color: string } | null;
  categories: { name: string } | null;
  transaction_labels: { labels: { name: string } | null }[] | null;
}

const LABEL_COLORS: Record<string, string> = {
  Need: "bg-blue-500/20 text-blue-300 border border-blue-500/20",
  Want: "bg-amber-500/20 text-amber-300 border border-amber-500/20",
  Investment: "bg-green-500/20 text-green-300 border border-green-500/20",
  Savings: "bg-purple-500/20 text-purple-300 border border-purple-500/20",
};

function groupByDate(transactions: Transaction[]) {
  const groups: Record<string, Transaction[]> = {};
  for (const tx of transactions) {
    if (!groups[tx.date]) groups[tx.date] = [];
    groups[tx.date].push(tx);
  }
  return groups;
}

function formatGroupHeader(dateStr: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const d = new Date(dateStr + "T00:00:00");
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

export default function TransactionFeed({
  transactions,
  wallets = [],
}: {
  transactions: Transaction[];
  wallets?: Wallet[];
}) {
  if (transactions.length === 0) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
        <p className="text-3xl mb-3">📋</p>
        <p className="text-white/50 text-sm">
          No transactions yet — add your first entry
        </p>
      </div>
    );
  }

  const groups = groupByDate(transactions);
  const sortedDates = Object.keys(groups).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-7">
      {sortedDates.map((date) => (
        <div key={date}>
          {/* Date section header */}
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs font-semibold text-white/35 uppercase tracking-widest">
              {formatGroupHeader(date)}
            </span>
            <div className="flex-1 h-px bg-white/8" />
          </div>

          {/* Rows */}
          <div className="space-y-2">
            {groups[date].map((tx) => (
              <TxRow key={tx.id} tx={tx} wallets={wallets} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TxRow({ tx, wallets }: { tx: Transaction; wallets: Wallet[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [swiped, setSwiped] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const touchStartX = useRef(0);

  const isOpeningBalance = tx.is_opening_balance === true;
  const entryType = tx.entry_type ?? (tx.type === "credit" ? "income" : "expense");
  const isTransfer = entryType === "transfer";
  const isIncome = entryType === "income";

  const labels =
    tx.transaction_labels
      ?.map((tl) => tl.labels?.name)
      .filter((n): n is string => Boolean(n)) ?? [];

  const displayDate = new Date(tx.date + "T00:00:00").toLocaleDateString(
    "en-IN",
    { month: "short", day: "numeric" }
  );

  const absAmount = Math.abs(Number(tx.amount));
  const formattedAmount = absAmount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // For transfers: resolve destination wallet from wallets list
  const toWallet = tx.to_wallet_id
    ? wallets.find((w) => w.id === tx.to_wallet_id) ?? null
    : null;
  const isDebitLeg = isTransfer && Number(tx.amount) < 0;
  const isCreditLeg = isTransfer && Number(tx.amount) >= 0;

  // Amount display
  let amountPrefix: string;
  let amountClass: string;
  if (isTransfer) {
    amountPrefix = isDebitLeg ? "−" : "+";
    amountClass = "text-blue-300";
  } else if (isIncome) {
    amountPrefix = "+";
    amountClass = "text-green-400";
  } else {
    amountPrefix = "−";
    amountClass = "text-red-400";
  }

  // Transfer description line
  let transferLabel: string | null = null;
  if (isDebitLeg) {
    transferLabel = `↔ Transfer → ${toWallet?.name ?? "another wallet"}`;
  } else if (isCreditLeg) {
    transferLabel = `↔ Transfer received`;
  }

  async function handleDelete() {
    setDeleting(true);
    if (tx.transfer_id) {
      await supabase.from("transactions").delete().eq("transfer_id", tx.transfer_id);
    } else {
      await supabase.from("transactions").delete().eq("id", tx.id);
    }
    router.refresh();
  }

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function onTouchEnd(e: React.TouchEvent) {
    const delta = touchStartX.current - e.changedTouches[0].clientX;
    if (delta > 60) setSwiped(true);
    else setSwiped(false);
  }

  // Opening balance rows — muted style, no delete
  if (isOpeningBalance) {
    return (
      <div
        className="bg-white/[0.03] border border-white/8 rounded-xl px-4 py-3 flex items-start gap-3"
        style={
          tx.wallet?.color
            ? { borderLeftColor: tx.wallet.color, borderLeftWidth: 3 }
            : {}
        }
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm italic text-white/50">
              🏦 Opening Balance
            </span>
          </div>
          {tx.wallet && (
            <p className="text-xs text-white/25 mt-0.5">
              {tx.wallet.emoji} {tx.wallet.name}
            </p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="font-bold text-sm text-green-400/70">
            +₹{absAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-white/20 mt-0.5">{displayDate}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative rounded-xl overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onClick={() => swiped && setSwiped(false)}
    >
      {/* Delete button revealed on swipe (mobile) */}
      <button
        onClick={(e) => { e.stopPropagation(); handleDelete(); }}
        disabled={deleting}
        className="absolute right-0 top-0 bottom-0 w-[70px] flex items-center justify-center bg-red-500 hover:bg-red-600 transition text-white text-sm font-semibold"
        aria-label="Delete transaction"
      >
        {deleting ? "…" : "Delete"}
      </button>

      {/* Row content — slides left on swipe */}
      <div
        className={`group relative bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-start gap-3 hover:bg-white/[0.07] transition-transform duration-200 ${
          swiped ? "-translate-x-[70px]" : "translate-x-0"
        }`}
        style={
          tx.wallet?.color
            ? { borderLeftColor: tx.wallet.color, borderLeftWidth: 3 }
            : {}
        }
      >
        {/* Left: description + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-white truncate">
              {transferLabel ?? tx.description}
            </span>
            {!isTransfer && tx.categories?.name && (
              <span className="text-xs bg-white/10 text-white/55 rounded-full px-2 py-0.5 shrink-0">
                {tx.categories.name}
              </span>
            )}
            {!isTransfer &&
              labels.map((l) => (
                <span
                  key={l}
                  className={`text-xs rounded-full px-2 py-0.5 shrink-0 ${LABEL_COLORS[l] ?? "bg-white/10 text-white/55"}`}
                >
                  {l}
                </span>
              ))}
            {isTransfer && (
              <span className="text-xs bg-blue-500/15 text-blue-300 border border-blue-500/20 rounded-full px-2 py-0.5 shrink-0">
                Transfer
              </span>
            )}
          </div>
          {tx.wallet && (
            <p className="text-xs text-white/30 mt-0.5">
              {tx.wallet.emoji} {tx.wallet.name}
            </p>
          )}
        </div>

        {/* Right: amount + date + hover delete */}
        <div className="flex items-start gap-3 shrink-0">
          <div className="text-right">
            <p className={`font-bold text-sm ${amountClass}`}>
              {amountPrefix}₹{formattedAmount}
            </p>
            <p className="text-xs text-white/25 mt-0.5">{displayDate}</p>
          </div>
          {/* Desktop hover delete */}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-white/30 hover:text-red-400 mt-0.5"
            aria-label="Delete transaction"
          >
            {deleting ? (
              <span className="text-xs">…</span>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14H6L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4h6v2" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
