export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import TransactionFeed, {
  type Transaction,
} from "@/components/tracker/TransactionFeed";

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
        wallets(name, emoji, color),
        categories(name),
        transaction_labels(labels(name))
      `
      )
      .eq("wallet_id", id)
      .order("date", { ascending: false }),
    supabase.from("wallets").select("id, name, emoji, color, created_at"),
  ]);

  if (!wallet) notFound();

  const transactions: Transaction[] = (rawTx ?? []) as Transaction[];

  // Compute wallet-level stats using entry_type
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];

  let totalIn = 0;
  let totalOut = 0;
  let thisMonth = 0;

  for (const tx of transactions) {
    const amount = Math.abs(Number(tx.amount));
    const entryType = tx.entry_type ?? (tx.type === "credit" ? "income" : "expense");
    if (tx.is_opening_balance) continue;
    if (entryType === "income") {
      totalIn += amount;
      if (tx.date >= startOfMonth) thisMonth += amount;
    } else if (entryType === "expense") {
      totalOut += amount;
      if (tx.date >= startOfMonth) thisMonth -= amount;
    }
  }

  const netBalance = totalIn - totalOut;

  const accent = wallet.color ?? "#2563EB";

  function fmt(n: number) {
    return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  return (
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
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-5">
            <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-2">
              Total In
            </p>
            <p className="text-green-400 font-bold text-xl">{fmt(totalIn)}</p>
            <p className="text-white/30 text-xs mt-1">All time</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-5">
            <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-2">
              Total Out
            </p>
            <p className="text-red-400 font-bold text-xl">{fmt(totalOut)}</p>
            <p className="text-white/30 text-xs mt-1">All time</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-5">
            <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-2">
              Net Balance
            </p>
            <p className={`font-bold text-xl ${netBalance >= 0 ? "text-green-400" : "text-red-400"}`}>
              {netBalance >= 0 ? "+" : "−"}{fmt(Math.abs(netBalance))}
            </p>
            <p className="text-white/30 text-xs mt-1">
              {now.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
            </p>
          </div>
        </div>

        {/* Transactions */}
        <section>
          <h2 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-4">
            Transactions
          </h2>
          <TransactionFeed transactions={transactions} wallets={allWallets ?? []} />
        </section>
    </main>
  );
}
