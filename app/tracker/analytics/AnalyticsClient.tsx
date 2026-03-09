"use client";

import SpendByCategory, {
  type CategorySpend,
} from "@/components/tracker/SpendByCategory";
import MonthlyChart, {
  type MonthlyDataPoint,
} from "@/components/tracker/MonthlyChart";
import NeedWantRatio, {
  type NeedWantData,
} from "@/components/tracker/NeedWantRatio";
import TrackerNav from "@/components/tracker/TrackerNav";

interface Props {
  chartData: CategorySpend[];
  monthlyData: MonthlyDataPoint[];
  needWant: NeedWantData;
  totalSpent: number;
  txCount: number;
}

export default function AnalyticsClient({
  chartData,
  monthlyData,
  needWant,
  totalSpent,
  txCount,
}: Props) {
  return (
    <>
      <TrackerNav />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 pb-16 space-y-8">
        <div>
          <h1 className="font-playfair text-2xl font-bold text-white">
            Analytics
          </h1>
          <p className="mt-1 text-white/40 text-sm">
            {txCount} transaction{txCount !== 1 ? "s" : ""} ·{" "}
            ₹{totalSpent.toLocaleString("en-IN", { maximumFractionDigits: 0 })} total
          </p>
        </div>

        {/* Monthly trend */}
        <MonthlyChart data={monthlyData} />

        {/* Category + Need/Want side by side on lg */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SpendByCategory data={chartData} />
          <NeedWantRatio
            needTotal={needWant.needTotal}
            wantTotal={needWant.wantTotal}
          />
        </div>
      </main>
    </>
  );
}
