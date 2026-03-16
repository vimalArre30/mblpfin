"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Wallet } from "./CreateWalletModal";
import AddEntryModal, { type EditableTransaction } from "./AddEntryModal";
import TransactionDetail from "./TransactionDetail";

export interface Transaction {
  id: string;
  wallet_id: string | null;
  category_id: string | null;
  amount: number;
  description: string;
  date: string;
  note: string | null;
  type: string;
  entry_type: string | null;
  is_opening_balance: boolean | null;
  transfer_id: string | null;
  to_wallet_id: string | null;
  wallet: { name: string; emoji: string; color: string } | null;
  categories: { name: string } | null;
  transaction_labels: { label_id: string; labels: { name: string } | null }[] | null;
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
  const router = useRouter();
  // Only one row swiped at a time
  const [swipedId, setSwipedId] = useState<string | null>(null);
  const [editingTx, setEditingTx] = useState<EditableTransaction | null>(null);
  const [viewingTx, setViewingTx] = useState<Transaction | null>(null);

  function handleSwipe(id: string | null) {
    setSwipedId(id);
  }

  async function handleDelete(tx: Transaction) {
    const supabase = createClient();
    if (tx.transfer_id) {
      await supabase.from("transactions").delete().eq("transfer_id", tx.transfer_id);
    } else {
      await supabase.from("transactions").delete().eq("id", tx.id);
    }
    setSwipedId(null);
    router.refresh();
  }

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
    <>
      <div
        className="space-y-7"
        // Tap on the feed background resets any open swipe
        onClick={() => swipedId && setSwipedId(null)}
      >
        {sortedDates.map((date) => (
          <div key={date}>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs font-semibold text-white/35 uppercase tracking-widest">
                {formatGroupHeader(date)}
              </span>
              <div className="flex-1 h-px bg-white/8" />
            </div>
            <div className="space-y-2">
              {groups[date].map((tx) => (
                <TxRow
                  key={tx.id}
                  tx={tx}
                  wallets={wallets}
                  isSwiped={swipedId === tx.id}
                  onSwipe={handleSwipe}
                  onEdit={(t) => { setSwipedId(null); setEditingTx(t); }}
                  onDelete={handleDelete}
                  onTap={(t) => { setSwipedId(null); setViewingTx(t); }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {editingTx && (
        <AddEntryModal
          wallets={wallets}
          editTx={editingTx}
          onCreated={() => { setEditingTx(null); router.refresh(); }}
          onClose={() => setEditingTx(null)}
        />
      )}

      {viewingTx && (
        <TransactionDetail
          tx={viewingTx}
          wallets={wallets}
          onClose={() => setViewingTx(null)}
        />
      )}
    </>
  );
}

function TxRow({
  tx,
  wallets,
  isSwiped,
  onSwipe,
  onEdit,
  onDelete,
  onTap,
}: {
  tx: Transaction;
  wallets: Wallet[];
  isSwiped: boolean;
  onSwipe: (id: string | null) => void;
  onEdit: (tx: EditableTransaction) => void;
  onDelete: (tx: Transaction) => void;
  onTap: (tx: Transaction) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchStartTime = useRef(0);
  // Suppress the synthetic click that fires after a handled touch-tap
  const suppressNextClick = useRef(false);
  // Keep latest values accessible inside the stable event handler closure
  const onSwipeRef = useRef(onSwipe);
  const onTapRef = useRef(onTap);
  const txRef = useRef(tx);
  const txIdRef = useRef(tx.id);
  const isSwipedRef = useRef(isSwiped);
  onSwipeRef.current = onSwipe;
  onTapRef.current = onTap;
  txRef.current = tx;
  txIdRef.current = tx.id;
  isSwipedRef.current = isSwiped;

  // Attach native touch listeners so they fire reliably on all mobile browsers
  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;

    function handleTouchStart(e: TouchEvent) {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      touchStartTime.current = Date.now();
    }

    function handleTouchEnd(e: TouchEvent) {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const dx = touchStartX.current - endX;          // positive = swipe left
      const absDx = Math.abs(dx);
      const absDy = Math.abs(touchStartY.current - endY);
      const elapsed = Date.now() - touchStartTime.current;

      // ── Tap: fast touch that barely moved ───────────────────────────────
      if (elapsed < 150 && absDx < 10 && absDy < 10) {
        suppressNextClick.current = true;
        if (isSwipedRef.current) {
          onSwipeRef.current(null);
        } else {
          onTapRef.current(txRef.current);
        }
        return;
      }

      // ── Swipe left (>60 px, clearly horizontal) ─────────────────────────
      if (dx > 60 && dx > absDy * 1.5) {
        onSwipeRef.current(txIdRef.current);
        return;
      }

      // ── Swipe right — close panel ────────────────────────────────────────
      if (dx < -20 && absDy < absDx) {
        onSwipeRef.current(null);
      }
    }

    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, []); // attach once on mount

  const isOpeningBalance = tx.is_opening_balance === true;
  const entryType = tx.entry_type ?? (tx.type === "credit" ? "income" : "expense");
  const isTransfer = entryType === "transfer";
  const isIncome = entryType === "income";
  const isDebitLeg = isTransfer && Number(tx.amount) < 0;
  const isCreditLeg = isTransfer && !isDebitLeg;

  // Credit leg of a transfer can't be edited (can't derive from-wallet)
  const canEdit = !isCreditLeg;
  // Action panel width: 130px (edit+delete) or 65px (delete only)
  const panelW = canEdit ? 130 : 65;

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

  const toWallet = tx.to_wallet_id
    ? wallets.find((w) => w.id === tx.to_wallet_id) ?? null
    : null;

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

  let transferLabel: string | null = null;
  if (isDebitLeg) {
    transferLabel = `↔ Transfer → ${toWallet?.name ?? "another wallet"}`;
  } else if (isCreditLeg) {
    transferLabel = `↔ Transfer received`;
  }

  async function handleDeleteClick(e: React.MouseEvent) {
    e.stopPropagation();
    setDeleting(true);
    await onDelete(tx);
    setDeleting(false);
  }

  const rowStyle = tx.wallet?.color
    ? { borderLeftColor: tx.wallet.color, borderLeftWidth: 3 }
    : {};

  return (
    <div
      ref={rowRef}
      className="relative rounded-xl overflow-hidden"
      onClick={(e) => {
        // Suppress the ghost click that follows a touch-handled tap
        if (suppressNextClick.current) {
          suppressNextClick.current = false;
          e.stopPropagation();
          return;
        }
        // Desktop click: close swipe panel if open, otherwise open detail view
        if (isSwiped) {
          e.stopPropagation();
          onSwipe(null);
        } else {
          onTap(tx);
        }
      }}
    >
      {/* Action panel — revealed on swipe */}
      {isSwiped && (
        <div
          className="absolute right-0 top-0 bottom-0 flex"
          style={{ width: panelW }}
        >
          {canEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(tx); }}
              className="flex-1 flex items-center justify-center bg-blue-600 hover:bg-blue-500 transition text-white text-xs font-semibold"
            >
              Edit
            </button>
          )}
          <button
            onClick={handleDeleteClick}
            disabled={deleting}
            className="flex-1 flex items-center justify-center bg-red-500 hover:bg-red-600 transition text-white text-xs font-semibold disabled:opacity-60"
          >
            {deleting ? "…" : "Delete"}
          </button>
        </div>
      )}

      {/* Row content */}
      {isOpeningBalance ? (
        <div
          className="relative bg-white/[0.03] border border-white/8 rounded-xl px-4 py-3 flex items-start gap-3 transition-transform duration-200"
          style={{ ...rowStyle, transform: isSwiped ? `translateX(-${panelW}px)` : "translateX(0)" }}
        >
          <div className="flex-1 min-w-0">
            <span className="text-sm italic text-white/50">🏦 Opening Balance</span>
            {tx.wallet && (
              <p className="text-xs text-white/25 mt-0.5">
                {tx.wallet.emoji} {tx.wallet.name}
              </p>
            )}
            {tx.note && (
              <p className="text-xs text-white/30 mt-0.5 italic">"{tx.note}"</p>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className="font-bold text-sm text-green-400/70">
              +₹{absAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-white/20 mt-0.5">{displayDate}</p>
          </div>
        </div>
      ) : (
        <div
          className="group relative bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-start gap-3 hover:bg-white/[0.07] transition-transform duration-200"
          style={{ ...rowStyle, transform: isSwiped ? `translateX(-${panelW}px)` : "translateX(0)" }}
        >
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
                    className={`text-xs rounded-full px-2 py-0.5 shrink-0 ${
                      LABEL_COLORS[l] ?? "bg-white/10 text-white/55"
                    }`}
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
            {tx.note && (
              <p className="text-xs text-white/25 mt-0.5 italic truncate">"{tx.note}"</p>
            )}
          </div>

          <div className="flex items-start gap-2 shrink-0">
            <div className="text-right">
              <p className={`font-bold text-sm ${amountClass}`}>
                {amountPrefix}₹{formattedAmount}
              </p>
              <p className="text-xs text-white/25 mt-0.5">{displayDate}</p>
            </div>
            {/* Desktop hover delete */}
            <button
              onClick={(e) => { e.stopPropagation(); handleDeleteClick(e); }}
              disabled={deleting}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-white/30 hover:text-red-400 mt-0.5 shrink-0"
              aria-label="Delete"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14H6L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4h6v2" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
