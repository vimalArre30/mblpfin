export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Transaction } from "@/components/tracker/TransactionFeed";
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

  const [{ data: wallet }, { data: rawTx }, { data: allWallets }] = await Promise.all([
    supabase
      .from("wallets")
      .select("id, name, emoji, color")
      .eq("id", id)
      .single(),
    supabase
      .from("transactions")
      .select(
        `
        *,
        wallet:wallets!transactions_wallet_id_fkey(name, emoji, color),
        categories(name),
        transaction_labels(label_id, labels(name))
      `
      )
      .eq("wallet_id", id)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase.from("wallets").select("id, name, emoji, color, created_at"),
  ]);

  if (!wallet) notFound();

  const transactions: Transaction[] = (rawTx ?? []) as Transaction[];

  // Compute wallet-level stats using entry_type
  let totalIn = 0;
  let totalOut = 0;
  let transfersIn = 0;
  let transfersOut = 0;

  for (const tx of transactions) {
    const raw = Number(tx.amount);
    const abs = Math.abs(raw);
    const entryType = tx.entry_type ?? (tx.type === "credit" ? "income" : "expense");

    if (entryType === "income" || tx.is_opening_balance) {
      totalIn += abs;
    } else if (entryType === "expense") {
      totalOut += abs;
    } else if (entryType === "transfer") {
      if (raw > 0) {
        // Credit leg — money arrived into this wallet
        transfersIn += abs;
      } else {
        // Debit leg — money left this wallet
        transfersOut += abs;
      }
    }
  }

  const netBalance = totalIn - totalOut + transfersIn - transfersOut;

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
            {transactions.length} transaction{transactions.length !== 1 ? "s" : ""}
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
          transactions={transactions}
          wallets={allWallets ?? []}
          accent={accent}
        />
    </main>
    <WalletDetailFAB defaultWalletId={wallet.id} wallets={(allWallets ?? []) as Wallet[]} />
    </>
  );
}
