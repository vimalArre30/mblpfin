export interface Transaction {
  id: string;
  amount: number;
  description: string;
  date: string;
  type: string;
  wallets: { name: string; emoji: string; color: string } | null;
  categories: { name: string } | null;
  transaction_labels: { labels: { name: string } | null }[] | null;
}

const LABEL_COLORS: Record<string, string> = {
  Need: "bg-blue-500/20 text-blue-300 border border-blue-500/20",
  Want: "bg-amber-500/20 text-amber-300 border border-amber-500/20",
  Investment: "bg-green-500/20 text-green-300 border border-green-500/20",
  Savings: "bg-purple-500/20 text-purple-300 border border-purple-500/20",
};

function groupByDate(transactions: Transaction[]) {
  const groups: Record<string, Transaction[]> = {};
  for (const tx of transactions) {
    if (!groups[tx.date]) groups[tx.date] = [];
    groups[tx.date].push(tx);
  }
  return groups;
}

function formatGroupHeader(dateStr: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const d = new Date(dateStr + "T00:00:00");
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

export default function TransactionFeed({
  transactions,
}: {
  transactions: Transaction[];
}) {
  if (transactions.length === 0) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
        <p className="text-3xl mb-3">📋</p>
        <p className="text-white/50 text-sm">
          No transactions yet — add your first entry
        </p>
      </div>
    );
  }

  const groups = groupByDate(transactions);
  const sortedDates = Object.keys(groups).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-7">
      {sortedDates.map((date) => (
        <div key={date}>
          {/* Date section header */}
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs font-semibold text-white/35 uppercase tracking-widest">
              {formatGroupHeader(date)}
            </span>
            <div className="flex-1 h-px bg-white/8" />
          </div>

          {/* Rows */}
          <div className="space-y-2">
            {groups[date].map((tx) => (
              <TxRow key={tx.id} tx={tx} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TxRow({ tx }: { tx: Transaction }) {
  const labels =
    tx.transaction_labels
      ?.map((tl) => tl.labels?.name)
      .filter((n): n is string => Boolean(n)) ?? [];

  const displayDate = new Date(tx.date + "T00:00:00").toLocaleDateString(
    "en-IN",
    { month: "short", day: "numeric" }
  );

  return (
    <div
      className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-start gap-3 hover:bg-white/[0.07] transition"
      style={
        tx.wallets?.color
          ? { borderLeftColor: tx.wallets.color, borderLeftWidth: 3 }
          : {}
      }
    >
      {/* Left: description + meta */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-white truncate">
            {tx.description}
          </span>
          {tx.categories?.name && (
            <span className="text-xs bg-white/10 text-white/55 rounded-full px-2 py-0.5 shrink-0">
              {tx.categories.name}
            </span>
          )}
          {labels.map((l) => (
            <span
              key={l}
              className={`text-xs rounded-full px-2 py-0.5 shrink-0 ${LABEL_COLORS[l] ?? "bg-white/10 text-white/55"}`}
            >
              {l}
            </span>
          ))}
        </div>
        {tx.wallets && (
          <p className="text-xs text-white/30 mt-0.5">
            {tx.wallets.emoji} {tx.wallets.name}
          </p>
        )}
      </div>

      {/* Right: amount + date */}
      <div className="text-right shrink-0">
        <p
          className={`font-bold text-sm ${
            tx.type === "credit" ? "text-green-400" : "text-white"
          }`}
        >
          {tx.type === "credit" ? "+" : "-"}₹
          {Number(tx.amount).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
        <p className="text-xs text-white/25 mt-0.5">{displayDate}</p>
      </div>
    </div>
  );
}
