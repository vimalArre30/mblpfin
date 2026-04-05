"use client";

import { useCallback, useMemo, useState } from "react";
import type { Transaction } from "@/components/tracker/TransactionFeed";
import TransactionFeed from "@/components/tracker/TransactionFeed";
import PeriodFilter from "@/components/tracker/PeriodFilter";
import WalletSnapshotPanel from "@/components/tracker/WalletSnapshotPanel";
import type { Wallet } from "@/components/tracker/CreateWalletModal";

type CategoryPill = {
  key: string; // category_id uuid | "transfer"
  name: string;
  total: number;
};

function fmt(n: number) {
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function WalletDetailFilter({
  transactions,
  wallets,
  accent,
}: {
  transactions: Transaction[];
  wallets: Wallet[];
  accent: string;
}) {
  const [selected, setSelected] = useState<string | null>(null); // null = All
  const [snapshotDate, setSnapshotDate] = useState<string | null>(null);

  // Period state
  const [periodStart, setPeriodStart] = useState<string>(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1).toISOString().split("T")[0];
  });
  const [periodEnd, setPeriodEnd] = useState<string>(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth() + 1, 0).toISOString().split("T")[0];
  });
  const [periodLabel, setPeriodLabel] = useState<string>(() =>
    new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })
  );

  const handlePeriodChange = useCallback((start: string, end: string, label: string) => {
    setPeriodStart(start);
    setPeriodEnd(end);
    setPeriodLabel(label);
    setSelected(null); // reset category filter on period change
  }, []);

  // Opening balance rows — always shown regardless of period or category filter
  const openingBalanceTx = useMemo(
    () => transactions.filter((tx) => tx.is_opening_balance),
    [transactions]
  );

  // Period-filtered non-opening-balance transactions
  const periodTx = useMemo(
    () => transactions.filter((tx) => !tx.is_opening_balance && tx.date >= periodStart && tx.date <= periodEnd),
    [transactions, periodStart, periodEnd]
  );

  // This-period net (income - expense, transfers included directionally)
  // Include opening balance if its date falls within the period
  const periodNet = useMemo(() => {
    let net = 0;
    const allPeriod = [
      ...periodTx,
      ...openingBalanceTx.filter((tx) => tx.date >= periodStart && tx.date <= periodEnd),
    ];
    for (const tx of allPeriod) {
      const raw = Number(tx.amount);
      const abs = Math.abs(raw);
      const et = tx.entry_type ?? (tx.type === "credit" ? "income" : "expense");
      if (et === "income" || tx.is_opening_balance) net += abs;
      else if (et === "expense") net -= abs;
      else if (et === "transfer") net += raw;
    }
    return net;
  }, [periodTx, openingBalanceTx, periodStart, periodEnd]);

  const { pills, totalCount } = useMemo(() => {
    const catMap = new Map<string, CategoryPill>();
    let transferTotal = 0;
    let hasTransfer = false;
    let count = 0;

    for (const tx of periodTx) {
      if (tx.is_opening_balance) continue;
      count++;

      const entryType =
        tx.entry_type ?? (tx.type === "credit" ? "income" : "expense");
      const abs = Math.abs(Number(tx.amount));

      if (entryType === "transfer") {
        transferTotal += abs;
        hasTransfer = true;
      } else if (tx.category_id && tx.categories?.name) {
        const existing = catMap.get(tx.category_id);
        if (existing) {
          existing.total += abs;
        } else {
          catMap.set(tx.category_id, {
            key: tx.category_id,
            name: tx.categories.name,
            total: abs,
          });
        }
      }
    }

    const pills: CategoryPill[] = Array.from(catMap.values()).sort(
      (a, b) => b.total - a.total
    );

    if (hasTransfer) {
      pills.push({ key: "transfer", name: "Transfers", total: transferTotal });
    }

    return { pills, totalCount: count };
  }, [periodTx]);

  const filtered = useMemo(() => {
    const base = selected
      ? periodTx.filter((tx) => {
          const entryType =
            tx.entry_type ?? (tx.type === "credit" ? "income" : "expense");
          if (selected === "transfer") return entryType === "transfer";
          return tx.category_id === selected;
        })
      : periodTx;
    // Opening balance always appended — never filtered out by period or category
    return [...base, ...openingBalanceTx];
  }, [periodTx, selected, openingBalanceTx]);

  function fmtAmount(n: number) {
    return `₹${n.toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  }

  const selectedStyle = { backgroundColor: accent, color: "#fff" };
  const unselectedStyle = {
    border: "1px solid rgba(255,255,255,0.15)",
    color: "rgba(255,255,255,0.5)",
  };

  return (
    <section className="space-y-4">
      <PeriodFilter onChange={handlePeriodChange} />

      {/* This Period net */}
      <div className="bg-white/[0.04] border border-white/8 rounded-xl px-4 py-3 flex items-center justify-between">
        <p className="text-xs text-white/40 uppercase tracking-wider">
          {periodLabel} · Net
        </p>
        <p className={`font-bold text-base ${periodNet >= 0 ? "text-green-400" : "text-red-400"}`}>
          {periodNet >= 0 ? "+" : "−"}{fmt(Math.abs(periodNet))}
        </p>
      </div>

      <h2 className="text-xs font-medium text-white/40 uppercase tracking-wider">
        Transactions
      </h2>

      {pills.length > 0 && (
        <div
          className="flex gap-2 overflow-x-auto pb-3 [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: "none" }}
        >
          {/* All pill */}
          <button
            onClick={() => setSelected(null)}
            className="shrink-0 h-11 px-4 rounded-full text-sm font-medium transition-colors whitespace-nowrap"
            style={selected === null ? selectedStyle : unselectedStyle}
          >
            All {totalCount}
          </button>

          {pills.map((pill) => (
            <button
              key={pill.key}
              onClick={() =>
                setSelected(selected === pill.key ? null : pill.key)
              }
              className="shrink-0 h-11 px-4 rounded-full text-sm font-medium transition-colors whitespace-nowrap"
              style={selected === pill.key ? selectedStyle : unselectedStyle}
            >
              {pill.name} {fmtAmount(pill.total)}
            </button>
          ))}
        </div>
      )}

      <TransactionFeed
        transactions={filtered}
        wallets={wallets}
        onSnapshotDate={setSnapshotDate}
      />

      {snapshotDate && (
        <WalletSnapshotPanel
          date={snapshotDate}
          transactions={transactions}
          onClose={() => setSnapshotDate(null)}
        />
      )}
    </section>
  );
}
