interface StatCardsProps {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  walletCount: number;
}

export default function StatCards({
  totalIncome,
  totalExpense,
  netBalance,
  walletCount,
}: StatCardsProps) {
  const netPositive = netBalance >= 0;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Total Income"
          value={`₹${totalIncome.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon="📈"
          valueClass="text-green-400"
        />
        <StatCard
          label="Total Expense"
          value={`₹${totalExpense.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon="📉"
          valueClass="text-red-400"
        />
        <StatCard
          label="Net Balance"
          value={`${netPositive ? "+" : "−"}₹${Math.abs(netBalance).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={netPositive ? "✅" : "⚠️"}
          valueClass={netPositive ? "text-green-300" : "text-red-300"}
        />
        <StatCard
          label="Wallets"
          value={String(walletCount)}
          icon="👛"
          valueClass="text-white"
        />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  valueClass,
}: {
  label: string;
  value: string;
  icon: string;
  valueClass: string;
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-white/40 uppercase tracking-wider">
          {label}
        </span>
        <span className="text-lg">{icon}</span>
      </div>
      <p className={`font-bold text-xl truncate ${valueClass}`}>{value}</p>
    </div>
  );
}
