import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/app/tracker/dashboard/SignOutButton";
import TrackerNav from "@/components/tracker/TrackerNav";
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

  const [{ data: wallet }, { data: rawTx }] = await Promise.all([
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
  ]);

  if (!wallet) notFound();

  const transactions: Transaction[] = (rawTx ?? []) as Transaction[];

  // Compute wallet-level stats
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];

  let totalSpent = 0;
  let thisMonth = 0;

  for (const tx of transactions) {
    const amount = Number(tx.amount);
    if (tx.type !== "credit") {
      totalSpent += amount;
      if (tx.date >= startOfMonth) thisMonth += amount;
    }
  }

  const accent = wallet.color ?? "#2563EB";

  function fmt(n: number) {
    return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  return (
    <div className="min-h-screen bg-navy-dark font-inter">
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-playfair text-lg font-semibold text-white tracking-tight">
            Mr. Bottom Line
          </span>
          <span className="text-white/25 text-sm">/</span>
          <span className="text-white/60 text-sm">Tracker</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-white/35 hidden sm:block">
            {user.email ?? ""}
          </span>
          <SignOutButton />
        </div>
      </header>

      <TrackerNav />

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
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-5">
            <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-2">
              Total Spent
            </p>
            <p className="text-white font-bold text-2xl">{fmt(totalSpent)}</p>
            <p className="text-white/30 text-xs mt-1">All time</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-5">
            <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-2">
              This Month
            </p>
            <p className="text-white font-bold text-2xl">{fmt(thisMonth)}</p>
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
          <TransactionFeed transactions={transactions} />
        </section>
      </main>
    </div>
  );
}
