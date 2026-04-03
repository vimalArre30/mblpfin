"use client";

import { useState, useMemo } from "react";
import type { Transaction } from "@/components/tracker/TransactionFeed";
import TransactionFeed from "@/components/tracker/TransactionFeed";
import type { Wallet } from "@/components/tracker/CreateWalletModal";

type CategoryPill = {
  key: string; // category_id uuid | "transfer"
  name: string;
  total: number;
};

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

  const { pills, totalCount } = useMemo(() => {
    const catMap = new Map<string, CategoryPill>();
    let transferTotal = 0;
    let hasTransfer = false;
    let count = 0;

    for (const tx of transactions) {
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
  }, [transactions]);

  const filtered = useMemo(() => {
    if (!selected) return transactions;
    return transactions.filter((tx) => {
      const entryType =
        tx.entry_type ?? (tx.type === "credit" ? "income" : "expense");
      if (selected === "transfer") return entryType === "transfer";
      return tx.category_id === selected;
    });
  }, [transactions, selected]);

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
    <section>
      <h2 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-4">
        Transactions
      </h2>

      {pills.length > 0 && (
        <div
          className="flex gap-2 overflow-x-auto pb-3 mb-4 [&::-webkit-scrollbar]:hidden"
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

      <TransactionFeed transactions={filtered} wallets={wallets} />
    </section>
  );
}
