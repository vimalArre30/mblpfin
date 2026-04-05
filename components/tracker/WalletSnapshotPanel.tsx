"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Transaction } from "./TransactionFeed";

function fmt(n: number) {
  return `₹${n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatPanelDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function StatRow({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass: string;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <p className="text-sm text-white/50">{label}</p>
      <p className={`text-sm tabular-nums ${valueClass}`}>{value}</p>
    </div>
  );
}

export default function WalletSnapshotPanel({
  date,
  transactions,
  onClose,
}: {
  date: string;
  transactions: Transaction[];
  onClose: () => void;
}) {
  const [visible, setVisible] = useState(false);
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

  // Drag-down to dismiss
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
    dragYRef.current = 0;
    setDragYState(0);
    setVisible(false);
    setTimeout(onClose, 250);
  }

  // Cumulative snapshot: all transactions for this wallet where date <= snapshotDate
  const stats = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;
    let transfersIn = 0;
    let transfersOut = 0;

    for (const tx of transactions) {
      if (tx.date > date) continue;

      const raw = Number(tx.amount);
      const abs = Math.abs(raw);
      const et = tx.entry_type ?? (tx.type === "credit" ? "income" : "expense");

      if (et === "income" || tx.is_opening_balance) {
        totalIn += abs;
      } else if (et === "expense") {
        totalOut += abs;
      } else if (et === "transfer") {
        if (raw > 0) transfersIn += abs;
        else transfersOut += abs;
      }
    }

    const net = totalIn - totalOut + transfersIn - transfersOut;
    return { totalIn, totalOut, transfersIn, transfersOut, net };
  }, [transactions, date]);

  const sheetStyle =
    dragYState > 0 ? { transform: `translateY(${dragYState}px)` } : undefined;

  const sheetTransformClass = !visible
    ? "translate-y-full sm:translate-y-0 sm:scale-95 sm:opacity-0"
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

      {/* Sheet (mobile) / Modal (desktop) */}
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

        <div className="px-6 pt-4 sm:pt-6 pb-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-xs text-white/35 uppercase tracking-wider mb-0.5">
                Snapshot
              </p>
              <h2 className="font-playfair text-lg font-semibold text-white leading-snug">
                {formatPanelDate(date)}
              </h2>
            </div>
            <button
              onClick={close}
              className="text-white/40 hover:text-white/80 transition w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 shrink-0"
              aria-label="Close snapshot"
            >
              ✕
            </button>
          </div>

          {/* Stat rows */}
          <div className="divide-y divide-white/6">
            <StatRow
              label="Total In"
              value={fmt(stats.totalIn)}
              valueClass="text-green-400"
            />
            <StatRow
              label="Total Out"
              value={fmt(stats.totalOut)}
              valueClass="text-red-400"
            />
            <StatRow
              label="Transfers In"
              value={fmt(stats.transfersIn)}
              valueClass="text-green-400"
            />
            <StatRow
              label="Transfers Out"
              value={fmt(stats.transfersOut)}
              valueClass="text-red-400"
            />
          </div>

          {/* Net Balance — separated with a heavier rule */}
          <div className="border-t-2 border-white/12 mt-1 pt-1">
            <StatRow
              label="Net Balance"
              value={
                (stats.net >= 0 ? "+" : "−") + fmt(Math.abs(stats.net))
              }
              valueClass={
                stats.net > 0
                  ? "text-green-400 font-bold text-base"
                  : stats.net < 0
                  ? "text-red-400 font-bold text-base"
                  : "text-white/60 font-bold text-base"
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
