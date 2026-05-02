"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
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
  walletName,
}: {
  transactions: Transaction[];
  wallets: Wallet[];
  accent: string;
  walletName: string;
}) {
  const supabase = useRef(createClient()).current;
  const [selected, setSelected] = useState<string | null>(null); // null = All
  const [snapshotDate, setSnapshotDate] = useState<string | null>(null);

  // AI insight state — wallet-scoped, refreshed on every period change
  const [insight, setInsight] = useState<string | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const insightFetchedForPeriod = useRef<string | null>(null);

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

  const handlePeriodChange = useCallback(
    async (start: string, end: string, label: string) => {
      setPeriodStart(start);
      setPeriodEnd(end);
      setPeriodLabel(label);
      setSelected(null); // reset category filter on period change

      // Fire AI insight fetch (wallet-scoped) — only once per period label
      if (insightFetchedForPeriod.current === label) return;
      insightFetchedForPeriod.current = label;
      setInsight(null);
      setInsightLoading(true);

      try {
        const session = await supabase.auth.getSession();
        const token = session.data.session?.access_token;
        if (!token) return;

        // Compute wallet-scoped period summary from already-loaded transactions
        let totalExp = 0;
        let totalIncome = 0;
        let needTotal = 0;
        let wantTotal = 0;
        const catTotals: Record<string, number> = {};

        for (const tx of transactions) {
          if (tx.is_opening_balance) continue;
          if (tx.date < start || tx.date > end) continue;
          const entryType =
            tx.entry_type ?? (tx.type === "credit" ? "income" : "expense");
          const amt = Math.abs(Number(tx.amount));

          if (entryType === "income") {
            totalIncome += amt;
            continue;
          }
          if (entryType !== "expense") continue;

          totalExp += amt;
          const catName = tx.categories?.name ?? "Uncategorised";
          catTotals[catName] = (catTotals[catName] ?? 0) + amt;

          const labelNames = (tx.transaction_labels ?? [])
            .map((tl) => tl.labels?.name)
            .filter((n): n is string => Boolean(n));
          if (labelNames.includes("Need")) needTotal += amt;
          if (labelNames.includes("Want")) wantTotal += amt;
        }

        const summary = {
          period: label,
          totalIncome,
          totalExpense: totalExp,
          needTotal,
          wantTotal,
          topCategories: Object.entries(catTotals)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([name, total]) => ({ name, total })),
        };

        const res = await fetch("/api/tracker/insights", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            type: "wallet",
            walletName,
            data: summary,
          }),
        });

        if (res.ok) {
          const json = await res.json();
          setInsight(json.insight ?? null);
        }
      } catch {
        // silent fail — insight is non-critical
      } finally {
        setInsightLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [walletName]
  );

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

      {/* AI Insight Card — wallet-scoped, refreshes on period change */}
      {insightLoading && (
        <div className="animate-pulse bg-white/5 border border-white/10 rounded-2xl p-4 h-16" />
      )}
      {!insightLoading && insight && (
        <div className="bg-[#3B5998]/20 border border-[#3B5998]/40 rounded-2xl px-5 py-4 flex gap-3 items-start">
          <span className="text-lg leading-none mt-0.5">✨</span>
          <p className="text-white/80 text-sm leading-relaxed">{insight}</p>
        </div>
      )}

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
