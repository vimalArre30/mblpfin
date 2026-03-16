"use client";

import { useEffect, useRef, useState } from "react";
import type { Transaction } from "./TransactionFeed";
import type { Wallet } from "./CreateWalletModal";

const LABEL_COLORS: Record<string, string> = {
  Need: "bg-blue-500/20 text-blue-300 border border-blue-500/20",
  Want: "bg-amber-500/20 text-amber-300 border border-amber-500/20",
  Investment: "bg-green-500/20 text-green-300 border border-green-500/20",
  Savings: "bg-purple-500/20 text-purple-300 border border-purple-500/20",
};

export default function TransactionDetail({
  tx,
  wallets,
  onClose,
}: {
  tx: Transaction;
  wallets: Wallet[];
  onClose: () => void;
}) {
  const [visible, setVisible] = useState(false);
  // dragYState drives the inline style; dragYRef is read inside native listeners
  const [dragYState, setDragYState] = useState(0);
  const dragYRef = useRef(0);
  const dragStartY = useRef(0);
  const isDragging = useRef(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Slide in on next frame
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Drag-down to dismiss (attached once; reads dragYRef inside)
  useEffect(() => {
    const el = sheetRef.current;
    if (!el) return;

    function onTouchStart(e: TouchEvent) {
      dragStartY.current = e.touches[0].clientY;
      isDragging.current = true;
      dragYRef.current = 0;
      setDragYState(0);
    }

    function onTouchMove(e: TouchEvent) {
      if (!isDragging.current) return;
      const dy = e.touches[0].clientY - dragStartY.current;
      if (dy > 0) {
        dragYRef.current = dy;
        setDragYState(dy);
      }
    }

    function onTouchEnd() {
      if (!isDragging.current) return;
      isDragging.current = false;
      if (dragYRef.current > 80) {
        close();
      } else {
        dragYRef.current = 0;
        setDragYState(0);
      }
    }

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function close() {
    // Reset any drag, trigger the slide-down CSS transition, then unmount
    dragYRef.current = 0;
    setDragYState(0);
    setVisible(false);
    setTimeout(onClose, 250);
  }

  // ── Derived display values ───────────────────────────────────────────────
  const isOpeningBalance = tx.is_opening_balance === true;
  const entryType = tx.entry_type ?? (tx.type === "credit" ? "income" : "expense");
  const isTransfer = entryType === "transfer";
  const isIncome = entryType === "income";
  const isDebitLeg = isTransfer && Number(tx.amount) < 0;

  const absAmount = Math.abs(Number(tx.amount));
  const formattedAmount = absAmount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  let amountPrefix: string;
  let amountClass: string;
  if (isTransfer) {
    amountPrefix = isDebitLeg ? "−" : "+";
    amountClass = "text-blue-300";
  } else if (isIncome || isOpeningBalance) {
    amountPrefix = "+";
    amountClass = "text-green-400";
  } else {
    amountPrefix = "−";
    amountClass = "text-red-400";
  }

  let badgeText: string;
  let badgeClass: string;
  if (isOpeningBalance) {
    badgeText = "Opening Balance";
    badgeClass = "bg-green-500/15 text-green-300 border border-green-500/20";
  } else if (isTransfer) {
    badgeText = "Transfer";
    badgeClass = "bg-blue-500/15 text-blue-300 border border-blue-500/20";
  } else if (isIncome) {
    badgeText = "Income";
    badgeClass = "bg-green-500/15 text-green-300 border border-green-500/20";
  } else {
    badgeText = "Expense";
    badgeClass = "bg-red-500/15 text-red-400 border border-red-500/20";
  }

  const toWallet = tx.to_wallet_id
    ? wallets.find((w) => w.id === tx.to_wallet_id) ?? null
    : null;

  const labels =
    tx.transaction_labels
      ?.map((tl) => tl.labels?.name)
      .filter((n): n is string => Boolean(n)) ?? [];

  const displayDate = new Date(tx.date + "T00:00:00").toLocaleDateString(
    "en-IN",
    { weekday: "short", month: "short", day: "numeric", year: "numeric" }
  );

  const title = isOpeningBalance
    ? "Opening Balance"
    : isTransfer && isDebitLeg
    ? `Transfer → ${toWallet?.name ?? "another wallet"}`
    : isTransfer
    ? "Transfer received"
    : tx.description;

  // When dragging, override transform with inline style; otherwise use CSS class
  const sheetStyle = dragYState > 0
    ? { transform: `translateY(${dragYState}px)` }
    : undefined;

  const sheetTransformClass = !visible ? "translate-y-full sm:translate-y-0 sm:scale-95 sm:opacity-0"
    : "translate-y-0 sm:scale-100 sm:opacity-100";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={close}
      />

      {/* Sheet (mobile bottom) / Modal (desktop centred) */}
      <div
        ref={sheetRef}
        style={sheetStyle}
        className={`relative w-full sm:w-[380px] bg-[#0F1E40] border border-white/12 rounded-t-2xl sm:rounded-2xl shadow-2xl transition-[transform,opacity] duration-250 ease-out ${sheetTransformClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle — mobile only */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden touch-none">
          <div className="w-10 h-1 bg-white/20 rounded-full" />
        </div>

        <div className="px-6 pt-4 sm:pt-6 pb-6 space-y-5">
          {/* Header: title + close button */}
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-playfair text-lg font-semibold text-white leading-snug flex-1 min-w-0">
              {title}
            </h2>
            <button
              onClick={close}
              className="text-white/40 hover:text-white/80 transition w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 shrink-0 mt-0.5"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* Amount + type badge */}
          <div className="flex items-center justify-between gap-3">
            <span className={`text-2xl font-bold tracking-tight ${amountClass}`}>
              {amountPrefix}₹{formattedAmount}
            </span>
            <span className={`text-xs font-medium rounded-full px-2.5 py-1 shrink-0 ${badgeClass}`}>
              {badgeText}
            </span>
          </div>

          {/* Details list */}
          <div className="space-y-3 text-sm">
            {/* Date */}
            <DetailRow icon="📅" label={displayDate} />

            {/* Wallet(s) */}
            {tx.wallet && (
              <DetailRow
                icon="👛"
                label={
                  isDebitLeg && toWallet
                    ? `${tx.wallet.emoji} ${tx.wallet.name}  →  ${toWallet.emoji ?? ""} ${toWallet.name}`
                    : `${tx.wallet.emoji} ${tx.wallet.name}`
                }
              />
            )}

            {/* Category */}
            {tx.categories?.name && (
              <div className="flex items-center gap-3">
                <span className="text-white/30 w-5 text-center text-base shrink-0">🏷️</span>
                <span className="bg-white/10 text-white/60 rounded-full px-2.5 py-0.5 text-xs">
                  {tx.categories.name}
                </span>
              </div>
            )}

            {/* Labels */}
            {labels.length > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-white/30 w-5 text-center text-base shrink-0">🔖</span>
                <div className="flex gap-1.5 flex-wrap">
                  {labels.map((l) => (
                    <span
                      key={l}
                      className={`text-xs rounded-full px-2.5 py-0.5 ${
                        LABEL_COLORS[l] ?? "bg-white/10 text-white/55"
                      }`}
                    >
                      {l}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Note */}
            {tx.note && (
              <div className="flex items-start gap-3">
                <span className="text-white/30 w-5 text-center text-base shrink-0 mt-0.5">📝</span>
                <p className="text-white/55 italic leading-relaxed">"{tx.note}"</p>
              </div>
            )}
          </div>

          {/* Done */}
          <button
            onClick={close}
            className="w-full bg-white/10 text-white/80 text-sm font-semibold rounded-xl py-2.5 hover:bg-white/15 transition mt-1"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-white/30 w-5 text-center text-base shrink-0">{icon}</span>
      <span className="text-white/70">{label}</span>
    </div>
  );
}
