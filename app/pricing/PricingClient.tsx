"use client";

import { useState } from "react";
import { startSubscriptionCheckout } from "@/lib/razorpay-checkout";

function CheckIcon() {
  return <span className="text-amber-400 font-bold">✓</span>;
}
function CrossIcon() {
  return <span className="text-white/25">✕</span>;
}

function PricingCard({
  label,
  price,
  sub,
  cta,
  highlight,
  loading,
  onSubscribe,
}: {
  label: string;
  price: string;
  sub: string;
  cta: string;
  highlight?: boolean;
  loading: boolean;
  onSubscribe: () => void;
}) {
  return (
    <div
      className={`relative rounded-2xl border p-6 flex flex-col ${
        highlight
          ? "bg-amber-500/10 border-amber-500/40"
          : "bg-white/5 border-white/12"
      }`}
    >
      {highlight && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-black text-[11px] font-bold px-3 py-0.5 rounded-full tracking-wide whitespace-nowrap">
          BEST VALUE
        </span>
      )}
      <p className="text-xs text-white/40 uppercase tracking-wider mb-3">{label}</p>
      <p className="text-4xl font-bold text-white leading-none">{price}</p>
      <p className="text-sm text-white/40 mt-1 mb-6">{sub}</p>
      <button
        onClick={onSubscribe}
        disabled={loading}
        className={`w-full rounded-xl py-3 text-sm font-semibold transition mt-auto disabled:opacity-50 disabled:cursor-not-allowed ${
          highlight
            ? "bg-amber-500 hover:bg-amber-400 text-black"
            : "bg-white/10 hover:bg-white/15 text-white border border-white/15"
        }`}
      >
        {loading ? "Loading…" : cta}
      </button>
    </div>
  );
}

const COMPARISON = [
  { feature: "Entries", free: "250", pro: "Unlimited" },
  { feature: "Voice + AI input", free: <CheckIcon />, pro: <CheckIcon /> },
  { feature: "Dashboard", free: <CheckIcon />, pro: <CheckIcon /> },
  { feature: "Multi-wallet", free: <CheckIcon />, pro: <CheckIcon /> },
  { feature: "Analytics", free: "Basic", pro: "Full" },
  { feature: "Data export", free: <CrossIcon />, pro: "✓ coming soon" },
  { feature: "Budget planner", free: <CrossIcon />, pro: "✓ coming soon" },
  { feature: "Priority support", free: <CrossIcon />, pro: <CheckIcon /> },
];

const FAQS = [
  {
    q: "What happens to my 250 free entries if I don't upgrade?",
    a: "They are completely safe. You can always view and browse your existing entries — you just won't be able to add new ones until you upgrade.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. You can cancel your subscription at any time from your Pro page. You'll retain Pro access until the end of your billing period.",
  },
  {
    q: "What payment methods are supported?",
    a: "All major credit and debit cards, UPI, and net banking via Razorpay — India's most trusted payment gateway.",
  },
  {
    q: "Is my financial data secure?",
    a: "Your data is stored securely in our encrypted Supabase database and is never shared with third parties. Only you can access your entries.",
  },
];

export default function PricingClient({
  prefill,
}: {
  prefill?: { name?: string; email?: string };
}) {
  const [loading, setLoading] = useState<"monthly" | "annual" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function subscribe(interval: "monthly" | "annual") {
    setError(null);
    setLoading(interval);
    try {
      await startSubscriptionCheckout({ interval, prefill });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      setError(msg);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-16">
      {/* Pricing cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-xl mx-auto">
        <PricingCard
          label="Monthly"
          price="₹199"
          sub="/month"
          cta="Get Started — ₹199/month"
          loading={loading === "monthly"}
          onSubscribe={() => subscribe("monthly")}
        />
        <PricingCard
          label="Annual"
          price="₹899"
          sub="₹75/month · billed yearly"
          cta="Get Started — ₹899/year"
          loading={loading === "annual"}
          onSubscribe={() => subscribe("annual")}
          highlight
        />
      </div>

      {error && (
        <div className="max-w-xl mx-auto -mt-10 px-5 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm text-center">
          {error}
        </div>
      )}

      {/* Feature comparison table */}
      <div>
        <h2 className="font-playfair text-xl font-semibold text-white mb-6 text-center">
          What&apos;s included
        </h2>
        <div className="rounded-2xl border border-white/10 overflow-hidden">
          <div className="grid grid-cols-3 bg-white/5 border-b border-white/10 px-5 py-3">
            <p className="text-xs text-white/40 uppercase tracking-wider">Feature</p>
            <p className="text-xs text-white/40 uppercase tracking-wider text-center">Free</p>
            <p className="text-xs text-amber-400 uppercase tracking-wider text-center">Pro</p>
          </div>
          {COMPARISON.map(({ feature, free, pro }, i) => (
            <div
              key={feature}
              className={`grid grid-cols-3 px-5 py-3.5 items-center text-sm ${
                i < COMPARISON.length - 1 ? "border-b border-white/6" : ""
              }`}
            >
              <p className="text-white/70">{feature}</p>
              <p className="text-center text-white/50">{free}</p>
              <p className="text-center text-white/80">{pro}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div>
        <h2 className="font-playfair text-xl font-semibold text-white mb-6 text-center">
          Frequently asked questions
        </h2>
        <div className="space-y-4">
          {FAQS.map(({ q, a }) => (
            <div
              key={q}
              className="bg-white/4 border border-white/10 rounded-xl px-5 py-4"
            >
              <p className="text-sm font-medium text-white mb-1.5">{q}</p>
              <p className="text-sm text-white/50 leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="text-center space-y-3 pb-4">
        <p className="text-white/40 text-sm">Ready to go unlimited?</p>
        <button
          onClick={() => subscribe("annual")}
          disabled={loading !== null}
          className="bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm rounded-xl px-8 py-3 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Loading…" : "Upgrade Now →"}
        </button>
      </div>
    </div>
  );
}
