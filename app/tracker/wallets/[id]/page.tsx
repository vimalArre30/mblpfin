export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getTotals } from "@/lib/tracker/totals";
import WalletDetailFAB from "./WalletDetailFAB";
import WalletDetailFilter from "./WalletDetailFilter";
import type { Wallet } from "@/components/tracker/CreateWalletModal";

export default async function WalletDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/tracker/login");

  const [{ data: wallet }, { data: allWallets }] = await Promise.all([
    supabase
      .from("wallets")
      .select("id, name, emoji, color")
      .eq("id", id)
      .single(),
    supabase.from("wallets").select("id, name, emoji, color, created_at"),
  ]);

  if (!wallet) notFound();

  // All-time wallet figures are computed in SQL (migration 008): income (incl. the
  // opening balance), expense and the signed transfer legs of THIS wallet. Throws on
  // failure rather than showing a balance built from partial data.
  const totals = await getTotals(supabase, { walletId: id });
  const totalIn = totals.income;
  const totalOut = totals.expense;
  const transfersIn = totals.transfers_in;
  const transfersOut = totals.transfers_out;
  const netBalance = totals.balance;

  const accent = wallet.color ?? "#2563EB";

  function fmt(n: number) {
    return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  return (
    <>
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Back */}
        <Link
          href="/tracker/wallets"
          className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition"
        >
          ← Back to Wallets
        </Link>

        {/* Wallet header */}
        <div
          className="bg-white/5 border border-white/10 rounded-2xl p-6"
          style={{ borderLeft: `4px solid ${accent}` }}
        >
          <div className="text-4xl mb-3">{wallet.emoji ?? "💼"}</div>
          <h1 className="font-playfair text-2xl font-bold text-white">
            {wallet.name}
          </h1>
          <p className="text-white/40 text-sm mt-1">
            {totals.entries.toLocaleString("en-IN")} transaction{totals.entries !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Wallet stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 sm:p-5 min-w-0 overflow-hidden">
            <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-1 sm:mb-2 truncate">
              Total In
            </p>
            <p className="text-green-400 font-bold text-sm sm:text-base md:text-lg truncate">{fmt(totalIn)}</p>
            <p className="text-white/30 text-xs mt-1">All time</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 sm:p-5 min-w-0 overflow-hidden">
            <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-1 sm:mb-2 truncate">
              Total Out
            </p>
            <p className="text-red-400 font-bold text-sm sm:text-base md:text-lg truncate">{fmt(totalOut)}</p>
            <p className="text-white/30 text-xs mt-1">All time</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 sm:p-5 min-w-0 overflow-hidden">
            <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-1 sm:mb-2 truncate">
              Net Balance
            </p>
            <p className={`font-bold text-sm sm:text-base md:text-lg truncate ${netBalance >= 0 ? "text-green-400" : "text-red-400"}`}>
              {netBalance >= 0 ? "+" : "−"}{fmt(Math.abs(netBalance))}
            </p>
            <p className="text-white/30 text-xs mt-1">All time</p>
          </div>
        </div>

        {/* Transfer breakdown — only shown when this wallet has transfers */}
        {(transfersIn > 0 || transfersOut > 0) && (
          <div className="grid grid-cols-2 gap-2 -mt-4">
            <div className="bg-white/[0.03] border border-white/8 rounded-xl px-4 py-3 flex items-center justify-between">
              <p className="text-xs text-white/40">Transfers In</p>
              <p className="text-blue-300 font-semibold text-sm">+{fmt(transfersIn)}</p>
            </div>
            <div className="bg-white/[0.03] border border-white/8 rounded-xl px-4 py-3 flex items-center justify-between">
              <p className="text-xs text-white/40">Transfers Out</p>
              <p className="text-blue-300/70 font-semibold text-sm">−{fmt(transfersOut)}</p>
            </div>
          </div>
        )}

        {/* Transactions with category filter */}
        <WalletDetailFilter
          walletId={wallet.id}
          wallets={allWallets ?? []}
          accent={accent}
          walletName={wallet.name}
        />
    </main>
    <WalletDetailFAB defaultWalletId={wallet.id} wallets={(allWallets ?? []) as Wallet[]} />
    </>
  );
}
