"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export interface CategorySpend {
  name: string;
  total: number;
}

const COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
];

export default function SpendByCategory({ data }: { data: CategorySpend[] }) {
  if (data.length === 0) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
        <p className="text-white/30 text-sm">No spend data yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
      <h2 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-6">
        Spend by Category
      </h2>
      <ResponsiveContainer width="100%" height={data.length * 44}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 32, bottom: 0, left: 0 }}
        >
          <XAxis
            type="number"
            tickFormatter={(v) =>
              `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
            }
            tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={100}
          />
          <Tooltip
            formatter={(value) => [
              `₹${Number(value).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
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
          <Bar dataKey="total" radius={[0, 4, 4, 0]}>
            {data.map((_, i) => (
              <Cell
                key={i}
                fill={COLORS[i % COLORS.length]}
                fillOpacity={0.8}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
