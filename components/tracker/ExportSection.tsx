"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetchTotals } from "@/lib/tracker/totals-client";
import { toLocalISO, todayLocalISO } from "@/lib/tracker/dates";
import { track } from "@/lib/analytics/track";

const MAX_ROWS = 10_000;

type Wallet = { id: string; name: string; emoji?: string | null };
type RangeKey = "month" | "last_month" | "fy" | "last_fy" | "custom";

/** 1 April of the financial year containing `d` (local calendar). */
function fyStart(d: Date): Date {
  return new Date(d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1, 3, 1);
}

function rangeFor(key: RangeKey): { from: string; to: string } | null {
  const now = new Date();
  if (key === "month") {
    return { from: toLocalISO(new Date(now.getFullYear(), now.getMonth(), 1)), to: todayLocalISO() };
  }
  if (key === "last_month") {
    return {
      from: toLocalISO(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
      to: toLocalISO(new Date(now.getFullYear(), now.getMonth(), 0)),
    };
  }
  if (key === "fy") return { from: toLocalISO(fyStart(now)), to: todayLocalISO() };
  if (key === "last_fy") {
    const s = fyStart(now);
    return {
      from: toLocalISO(new Date(s.getFullYear() - 1, 3, 1)),
      to: toLocalISO(new Date(s.getFullYear(), 2, 31)),
    };
  }
  return null;
}

export default function ExportSection({ isPro, wallets }: { isPro: boolean; wallets: Wallet[] }) {
  const [key, setKey] = useState<RangeKey>("fy");
  const [customFrom, setCustomFrom] = useState(() => toLocalISO(fyStart(new Date())));
  const [customTo, setCustomTo] = useState(todayLocalISO);
  const [walletId, setWalletId] = useState("");
  const [count, setCount] = useState<number | null>(null);
  const [countError, setCountError] = useState(false);

  const fyFrom = useMemo(() => toLocalISO(fyStart(new Date())), []);
  const { from, to } = key === "custom" ? { from: customFrom, to: customTo } : rangeFor(key)!;

  const freeBlocked = !isPro && from < fyFrom;
  const badRange = !from || !to || from > to;
  const tooMany = count !== null && count > MAX_ROWS;
  const canDownload = !badRange && !freeBlocked && !tooMany && count !== null;

  useEffect(() => {
    if (badRange) {
      setCount(null);
      return;
    }
    let live = true;
    setCount(null);
    setCountError(false);
    fetchTotals({ from, to, walletId: walletId || null })
      .then((t) => live && setCount(t.entries))
      .catch(() => live && setCountError(true));
    return () => {
      live = false;
    };
  }, [from, to, walletId, badRange]);

  const qs = new URLSearchParams({ from, to, ...(walletId ? { wallet_id: walletId } : {}) }).toString();
  const pill = (k: RangeKey, label: string, proOnly = false) => (
    <button
      key={k}
      type="button"
      onClick={() => setKey(k)}
      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
        key === k
          ? "bg-amber-500/15 border-amber-500/40 text-amber-300"
          : "bg-white/5 border-white/10 text-white/60 hover:text-white"
      }`}
    >
      {label}
      {proOnly && !isPro ? " · Pro" : ""}
    </button>
  );

  return (
    <section className="mt-8 bg-white/[0.03] border border-white/10 rounded-2xl p-5">
      <h2 className="font-playfair text-lg font-bold text-white">Export</h2>
      <p className="mt-1 text-sm text-white/40">
        Download your entries as a CSV, or a formatted PDF statement.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {pill("month", "This month")}
        {pill("last_month", "Last month", true)}
        {pill("fy", "This financial year")}
        {pill("last_fy", "Last financial year", true)}
        {pill("custom", "Custom", true)}
      </div>

      {key === "custom" && (
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-white/70">
          <label className="flex items-center gap-2">
            From
            <input
              type="date"
              value={customFrom}
              max={customTo}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white"
            />
          </label>
          <label className="flex items-center gap-2">
            To
            <input
              type="date"
              value={customTo}
              min={customFrom}
              onChange={(e) => setCustomTo(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white"
            />
          </label>
        </div>
      )}

      <div className="mt-3">
        <select
          value={walletId}
          onChange={(e) => setWalletId(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
        >
          <option value="">All wallets</option>
          {wallets.map((w) => (
            <option key={w.id} value={w.id}>
              {w.emoji ? `${w.emoji} ` : ""}
              {w.name}
            </option>
          ))}
        </select>
      </div>

      <p className="mt-3 text-sm text-white/50" aria-live="polite">
        {badRange
          ? "Pick a valid date range."
          : countError
            ? "Couldn't count entries — try again."
            : count === null
              ? "Counting entries…"
              : tooMany
                ? `${count.toLocaleString("en-IN")} entries is more than the ${MAX_ROWS.toLocaleString("en-IN")} export limit. Choose a shorter range.`
                : `${count.toLocaleString("en-IN")} ${count === 1 ? "entry" : "entries"} in this range`}
      </p>
      {freeBlocked && (
        <p className="mt-1 text-sm text-amber-300/90">
          Free plans can export the current financial year only.{" "}
          <Link href="/pro" className="underline">
            See Pro
          </Link>
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        <a
          href={canDownload ? `/api/tracker/export/csv?${qs}` : undefined}
          download
          aria-disabled={!canDownload}
          onClick={() => canDownload && track("export_downloaded", { kind: "csv" })}
          className={`px-4 py-2 rounded-xl text-sm font-semibold ${
            canDownload ? "bg-amber-500 text-black" : "bg-white/10 text-white/30 pointer-events-none"
          }`}
        >
          Download CSV
        </a>
        <a
          href={canDownload ? `/api/tracker/export/pdf?${qs}` : undefined}
          download
          aria-disabled={!canDownload}
          onClick={() => canDownload && track("export_downloaded", { kind: "pdf" })}
          className={`px-4 py-2 rounded-xl text-sm font-semibold border ${
            canDownload
              ? "border-amber-500/50 text-amber-300"
              : "border-white/10 text-white/30 pointer-events-none"
          }`}
        >
          Download PDF
        </a>
      </div>
    </section>
  );
}
