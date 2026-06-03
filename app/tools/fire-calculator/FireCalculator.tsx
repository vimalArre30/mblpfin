"use client";

import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

// ─── helpers ────────────────────────────────────────────────────────────────

function formatCrore(value: number): string {
  if (value >= 1_00_00_000) return `₹${(value / 1_00_00_000).toFixed(2)} Cr`;
  if (value >= 1_00_000) return `₹${(value / 1_00_000).toFixed(1)}L`;
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

function formatINR(value: number): string {
  return `₹${value.toLocaleString("en-IN")}`;
}

interface DataPoint {
  age: number;
  year: number;
  corpus: number;
  target: number;
  isFIREYear?: boolean;
}

interface FIREResult {
  fireCorpusToday: number;
  yearsToFIRE: number | null;
  fireAge: number | null;
  realReturn: number;
  chartData: DataPoint[];
}

function computeFIRE(
  currentAge: number,
  currentSavings: number, // ₹
  monthlyInvestment: number, // ₹
  monthlyExpenses: number, // ₹ in today's terms
  annualReturn: number, // % e.g. 12
  inflationRate: number, // % e.g. 6
  withdrawalRate: number // % e.g. 3.5
): FIREResult {
  const r = annualReturn / 100;
  const inf = inflationRate / 100;
  const swr = withdrawalRate / 100;

  // FIRE corpus needed in today's terms
  const annualExpensesToday = monthlyExpenses * 12;
  const fireCorpusToday = annualExpensesToday / swr;

  // Real return (Fisher equation)
  const realReturn = (1 + r) / (1 + inf) - 1;

  const chartData: DataPoint[] = [];
  let corpus = currentSavings;
  let fireYear: number | null = null;
  let fireAge: number | null = null;

  for (let year = 0; year <= 50; year++) {
    const age = currentAge + year;
    // Target grows with inflation each year (needed corpus in nominal ₹)
    const inflationAdjustedTarget = fireCorpusToday * Math.pow(1 + inf, year);

    chartData.push({
      age,
      year,
      corpus: Math.round(corpus),
      target: Math.round(inflationAdjustedTarget),
      isFIREYear: false,
    });

    if (fireYear === null && corpus >= inflationAdjustedTarget) {
      fireYear = year;
      fireAge = age;
      chartData[year].isFIREYear = true;
    }

    if (year < 50) {
      // Grow corpus for next year
      corpus = corpus * (1 + r) + monthlyInvestment * 12;
    }
  }

  return {
    fireCorpusToday,
    yearsToFIRE: fireYear,
    fireAge,
    realReturn: realReturn * 100,
    chartData,
  };
}

// ─── custom tooltip ──────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-border rounded-lg p-3 shadow-md text-sm">
      <p className="font-semibold text-ink mb-1">Age {label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {formatCrore(p.value)}
        </p>
      ))}
    </div>
  );
}

// ─── Slider input ─────────────────────────────────────────────────────────────

function SliderInput({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
  hint?: string;
}) {
  return (
    <div className="mb-5">
      <div className="flex justify-between items-baseline mb-1">
        <label className="text-sm font-medium text-ink">{label}</label>
        <span className="text-navy font-semibold text-sm">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-border rounded-full appearance-none cursor-pointer accent-navy"
      />
      <div className="flex justify-between text-xs text-body/50 mt-0.5">
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
      {hint && <p className="text-xs text-body/60 mt-1">{hint}</p>}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function FireCalculator() {
  const [currentAge, setCurrentAge] = useState(30);
  const [currentSavings, setCurrentSavings] = useState(15_00_000); // ₹15L
  const [monthlyInvestment, setMonthlyInvestment] = useState(30_000); // ₹30K/mo
  const [monthlyExpenses, setMonthlyExpenses] = useState(60_000); // ₹60K/mo
  const [annualReturn, setAnnualReturn] = useState(12); // 12%
  const [inflationRate, setInflationRate] = useState(6); // 6%
  const [withdrawalRate, setWithdrawalRate] = useState(3.5); // 3.5%

  const result = useMemo(
    () =>
      computeFIRE(
        currentAge,
        currentSavings,
        monthlyInvestment,
        monthlyExpenses,
        annualReturn,
        inflationRate,
        withdrawalRate
      ),
    [
      currentAge,
      currentSavings,
      monthlyInvestment,
      monthlyExpenses,
      annualReturn,
      inflationRate,
      withdrawalRate,
    ]
  );

  // Only show chart up to 5 years past FIRE (or max 40 years)
  const chartWindow = result.fireAge
    ? Math.min(result.fireAge + 5 - currentAge, 40)
    : 40;
  const chartData = result.chartData.slice(0, chartWindow + 1);

  const fireCorpusAtRetirement =
    result.yearsToFIRE !== null
      ? result.chartData[result.yearsToFIRE]?.corpus
      : null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* ── Header ── */}
      <div className="mb-8">
        <p className="text-xs font-semibold tracking-widest text-navy/60 uppercase mb-2">
          Financial Independence · India
        </p>
        <h1 className="font-playfair text-3xl md:text-4xl text-ink font-bold leading-tight mb-3">
          FIRE Calculator India
        </h1>
        <p className="text-body text-base leading-relaxed max-w-2xl">
          Calculate your Financial Independence number using India-specific assumptions — 6% inflation, 3.5% safe withdrawal rate, and real rupee values. Adjust the sliders to match your situation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* ── Inputs ── */}
        <div className="lg:col-span-2 bg-surface-gray rounded-2xl p-6">
          <h2 className="font-playfair text-lg font-semibold text-ink mb-5">Your Numbers</h2>

          <SliderInput
            label="Current Age"
            value={currentAge}
            min={22}
            max={55}
            step={1}
            format={(v) => `${v} yrs`}
            onChange={setCurrentAge}
          />

          <SliderInput
            label="Current Savings / Investments"
            value={currentSavings}
            min={0}
            max={2_00_00_000}
            step={1_00_000}
            format={formatCrore}
            onChange={setCurrentSavings}
            hint="Include MFs, stocks, EPF, PPF, FDs — anything earmarked for retirement"
          />

          <SliderInput
            label="Monthly Investment"
            value={monthlyInvestment}
            min={5_000}
            max={5_00_000}
            step={5_000}
            format={formatINR}
            onChange={setMonthlyInvestment}
            hint="SIP + any additional savings you invest each month"
          />

          <SliderInput
            label="Monthly Expenses (Today's ₹)"
            value={monthlyExpenses}
            min={20_000}
            max={5_00_000}
            step={5_000}
            format={formatINR}
            onChange={setMonthlyExpenses}
            hint="Your current lifestyle cost — the calculator inflation-adjusts this for you"
          />

          <div className="border-t border-border pt-4 mt-1">
            <h3 className="text-sm font-semibold text-body mb-3">Assumptions</h3>
            <SliderInput
              label="Expected Annual Return"
              value={annualReturn}
              min={7}
              max={15}
              step={0.5}
              format={(v) => `${v}%`}
              onChange={setAnnualReturn}
              hint="Equity MFs historically ~12% in India over 15+ year periods"
            />
            <SliderInput
              label="Inflation Rate"
              value={inflationRate}
              min={4}
              max={9}
              step={0.5}
              format={(v) => `${v}%`}
              onChange={setInflationRate}
              hint="India CPI averages 6–7%. Healthcare inflates at 12–15%."
            />
            <SliderInput
              label="Safe Withdrawal Rate"
              value={withdrawalRate}
              min={2.5}
              max={5}
              step={0.25}
              format={(v) => `${v}%`}
              onChange={setWithdrawalRate}
              hint="3.5% is conservative for India (vs 4% US Trinity Study). Lower = safer."
            />
          </div>
        </div>

        {/* ── Results ── */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          {/* Result cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-navy rounded-2xl p-5 text-white">
              <p className="text-white/60 text-xs uppercase tracking-wider mb-1">FIRE Corpus Needed</p>
              <p className="font-playfair text-2xl font-bold">
                {formatCrore(result.fireCorpusToday)}
              </p>
              <p className="text-white/50 text-xs mt-1">In today&apos;s rupees</p>
            </div>

            <div
              className={`rounded-2xl p-5 ${
                result.fireAge
                  ? result.fireAge <= 45
                    ? "bg-emerald-600 text-white"
                    : result.fireAge <= 55
                    ? "bg-amber-500 text-white"
                    : "bg-surface-gray text-ink"
                  : "bg-surface-gray text-ink"
              }`}
            >
              <p className={`text-xs uppercase tracking-wider mb-1 ${result.fireAge ? (result.fireAge <= 55 ? "text-white/70" : "text-body/60") : "text-body/60"}`}>
                {result.fireAge ? "FIRE Age" : "Not in 50 yrs"}
              </p>
              <p className="font-playfair text-2xl font-bold">
                {result.fireAge ? `Age ${result.fireAge}` : "∞"}
              </p>
              <p className={`text-xs mt-1 ${result.fireAge ? (result.fireAge <= 55 ? "text-white/60" : "text-body/50") : "text-body/50"}`}>
                {result.yearsToFIRE !== null
                  ? `${result.yearsToFIRE} years from now`
                  : "Increase savings or reduce expenses"}
              </p>
            </div>

            <div className="bg-surface-gray rounded-2xl p-4">
              <p className="text-body/60 text-xs uppercase tracking-wider mb-1">Corpus at FIRE</p>
              <p className="font-playfair text-xl font-semibold text-ink">
                {fireCorpusAtRetirement
                  ? formatCrore(fireCorpusAtRetirement)
                  : "—"}
              </p>
              <p className="text-body/50 text-xs mt-1">Inflation-adjusted</p>
            </div>

            <div className="bg-surface-gray rounded-2xl p-4">
              <p className="text-body/60 text-xs uppercase tracking-wider mb-1">Real Return</p>
              <p className="font-playfair text-xl font-semibold text-ink">
                {result.realReturn.toFixed(1)}%
              </p>
              <p className="text-body/50 text-xs mt-1">Return minus inflation</p>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-white border border-border rounded-2xl p-5">
            <h3 className="font-playfair text-base font-semibold text-ink mb-4">
              Corpus Growth vs FIRE Target
            </h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E0E4ED" />
                <XAxis
                  dataKey="age"
                  tickFormatter={(v) => `${v}`}
                  label={{ value: "Age", position: "insideBottom", offset: -2, fontSize: 11 }}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  tickFormatter={(v) => {
                    if (v >= 1_00_00_000) return `${(v / 1_00_00_000).toFixed(0)}Cr`;
                    if (v >= 1_00_000) return `${(v / 1_00_000).toFixed(0)}L`;
                    return `${v}`;
                  }}
                  tick={{ fontSize: 11 }}
                  width={48}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
                  formatter={(value) =>
                    value === "corpus" ? "Your Corpus" : "FIRE Target (inflation-adj.)"
                  }
                />
                {result.fireAge && (
                  <ReferenceLine
                    x={result.fireAge}
                    stroke="#1B2E5E"
                    strokeDasharray="4 4"
                    label={{
                      value: `FIRE at ${result.fireAge}`,
                      position: "top",
                      fontSize: 11,
                      fill: "#1B2E5E",
                    }}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="corpus"
                  stroke="#1B2E5E"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="target"
                  stroke="#E57373"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Methodology note */}
          <div className="bg-surface-gray rounded-xl p-4 text-xs text-body/70 leading-relaxed">
            <strong className="text-ink">Methodology:</strong> FIRE corpus = (Monthly expenses × 12) ÷ withdrawal rate, in today&apos;s rupees. The target line grows with inflation each year. Corpus grows at your expected return plus annual investments. Real return = (1 + return) ÷ (1 + inflation) − 1. Based on India-specific research: 6% average CPI inflation, 3.5% conservative SWR (vs US 4% Trinity Study). Does not account for EPF/NPS lock-ins or tax on withdrawals — treat as a planning estimate, not a guarantee.
          </div>
        </div>
      </div>

      {/* ── CTA ── */}
      <div className="mt-10 border border-border rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <p className="font-playfair text-lg font-semibold text-ink">Track the journey, not just the number</p>
          <p className="text-body text-sm mt-1">
            Knowing your FIRE number is step one. Tracking every rupee to get there is step two.
            MBL PFin makes expense logging a 3-second voice habit.
          </p>
        </div>
        <a
          href="https://www.mrbottomline.club/pro"
          className="shrink-0 bg-navy text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-navy-dark transition-colors"
        >
          Try MBL PFin Free →
        </a>
      </div>
    </div>
  );
}
