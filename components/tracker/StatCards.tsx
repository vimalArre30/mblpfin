interface StatCardsProps {
  totalSpent: number;
  thisMonth: number;
  walletCount: number;
}

export default function StatCards({
  totalSpent,
  thisMonth,
  walletCount,
}: StatCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <StatCard
        label="Total Spent"
        value={`₹${totalSpent.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        icon="💸"
        sub="All time"
      />
      <StatCard
        label="This Month"
        value={`₹${thisMonth.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        icon="📅"
        sub={new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
      />
      <StatCard
        label="Wallets"
        value={String(walletCount)}
        icon="👛"
        sub="Active buckets"
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  sub,
}: {
  label: string;
  value: string;
  icon: string;
  sub: string;
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-white/40 uppercase tracking-wider">
          {label}
        </span>
        <span className="text-xl">{icon}</span>
      </div>
      <p className="text-white font-bold text-2xl truncate">{value}</p>
      <p className="text-white/35 text-xs mt-1">{sub}</p>
    </div>
  );
}
