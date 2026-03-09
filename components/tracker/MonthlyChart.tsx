"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export interface MonthlyDataPoint {
  month: string; // "Mar 2026"
  total: number;
}

export default function MonthlyChart({ data }: { data: MonthlyDataPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
        <p className="text-white/30 text-sm">No data for the last 6 months.</p>
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
      <h2 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-6">
        Monthly Spend (last 6 months)
      </h2>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 0, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid
            vertical={false}
            stroke="rgba(255,255,255,0.05)"
          />
          <XAxis
            dataKey="month"
            tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v) =>
              `₹${(v / 1000).toFixed(0)}k`
            }
            tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={44}
          />
          <Tooltip
            formatter={(value) => [
              `₹${Number(value).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
              })}`,
              "Spent",
            ]}
            contentStyle={{
              background: "#0F1E40",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              color: "#fff",
              fontSize: 13,
            }}
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
          />
          <Bar
            dataKey="total"
            fill="#6366F1"
            fillOpacity={0.85}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
