"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import TransactionFeed from "@/components/tracker/TransactionFeed";
import PeriodFilter from "@/components/tracker/PeriodFilter";
import LoadMoreFooter from "@/components/tracker/LoadMoreFooter";
import WalletSnapshotPanel from "@/components/tracker/WalletSnapshotPanel";
import type { Wallet } from "@/components/tracker/CreateWalletModal";
import { toLocalISO } from "@/lib/tracker/dates";
import { fetchTotals } from "@/lib/tracker/totals-client";
import type { TotalsResponse } from "@/lib/tracker/totals-types";
import { usePagedTransactions } from "@/lib/tracker/usePagedTransactions";
import { useTrackerChanged } from "@/lib/tracker/changed";

type CategoryPill = {
  key: string; // category_id uuid | "transfer"
  name: string;
  total: number;
};

function fmt(n: number) {
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function WalletDetailFilter({
  walletId,
  wallets,
  accent,
  walletName,
}: {
  walletId: string;
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
    return toLocalISO(new Date(n.getFullYear(), n.getMonth(), 1));
  });
  const [periodEnd, setPeriodEnd] = useState<string>(() => {
    const n = new Date();
    return toLocalISO(new Date(n.getFullYear(), n.getMonth() + 1, 0));
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

        // Wallet-scoped period summary, computed in SQL (opening balance excluded).
        const t = await fetchTotals({
          from: start,
          to: end,
          walletId,
          excludeOpening: true,
          include: ["by_category", "labels"],
        });
        const labelTotal = (n: string) => t.labels?.find((l) => l.name === n)?.total ?? 0;

        const summary = {
          period: label,
          totalIncome: t.income,
          totalExpense: t.expense,
          needTotal: labelTotal("Need"),
          wantTotal: labelTotal("Want"),
          topCategories: (t.by_category ?? []).slice(0, 5).map((c) => ({
            name: c.name,
            total: c.total,
          })),
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
    [walletName, walletId]
  );

  // ── Figures for the selected period, all computed in SQL ──────────────
  const [refreshKey, setRefreshKey] = useState(0);
  useTrackerChanged(() => setRefreshKey((k) => k + 1));

  // Net for the period (opening balance included when its date is in the period)
  const [periodSummary, setPeriodSummary] = useState<TotalsResponse | null>(null);
  // Category pills + non-opening entry count for the period
  const [pillTotals, setPillTotals] = useState<TotalsResponse | null>(null);
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchTotals({ from: periodStart, to: periodEnd, walletId }),
      fetchTotals({
        from: periodStart,
        to: periodEnd,
        walletId,
        excludeOpening: true,
        include: ["by_category"],
        categoryTypes: ["expense", "income"],
      }),
    ])
      .then(([a, b]) => {
        if (cancelled) return;
        setPeriodSummary(a);
        setPillTotals(b);
      })
      .catch(() => {
        if (cancelled) return;
        setPeriodSummary(null);
        setPillTotals(null);
      });
    return () => {
      cancelled = true;
    };
  }, [periodStart, periodEnd, walletId, refreshKey]);

  const periodNet = periodSummary?.balance ?? 0;
  const totalCount = pillTotals?.entries ?? 0;
  const pills = useMemo(() => {
    const out: CategoryPill[] = (pillTotals?.by_category ?? [])
      .filter((c) => c.category_id !== null)
      .map((c) => ({ key: c.category_id as string, name: c.name, total: c.total }));
    const transferTotal = (pillTotals?.transfers_in ?? 0) + (pillTotals?.transfers_out ?? 0);
    if (transferTotal > 0) out.push({ key: "transfer", name: "Transfers", total: transferTotal });
    return out;
  }, [pillTotals]);

  // ── The list: keyset-paged, 50 at a time ──────────────────────────────
  const listFilters = useMemo(
    () => ({
      from: periodStart,
      to: periodEnd,
      walletId,
      categoryId: selected && selected !== "transfer" ? selected : null,
      entryType: selected === "transfer" ? ("transfer" as const) : null,
      opening: "exclude" as const,
    }),
    [periodStart, periodEnd, walletId, selected]
  );
  const feed = usePagedTransactions(listFilters);

  // Opening-balance row(s): always shown, never filtered by period or category.
  const openingFilters = useMemo(
    () => ({ walletId, opening: "only" as const }),
    [walletId]
  );
  const opening = usePagedTransactions(openingFilters);

  const filtered = useMemo(
    () => (feed.hasMore ? feed.rows : [...feed.rows, ...opening.rows]),
    [feed.rows, feed.hasMore, opening.rows]
  );

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

      {feed.loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="animate-pulse bg-white/5 border border-white/8 rounded-xl h-14" />
          ))}
        </div>
      ) : (
        <TransactionFeed
          transactions={filtered}
          wallets={wallets}
          onSnapshotDate={setSnapshotDate}
          analyticsSource="wallet_detail"
        />
      )}
      <LoadMoreFooter
        shown={feed.rows.length}
        total={feed.total}
        hasMore={feed.hasMore}
        loading={feed.loadingMore}
        onLoadMore={feed.loadMore}
      />

      {snapshotDate && (
        <WalletSnapshotPanel
          date={snapshotDate}
          walletId={walletId}
          onClose={() => setSnapshotDate(null)}
        />
      )}
    </section>
  );
}
