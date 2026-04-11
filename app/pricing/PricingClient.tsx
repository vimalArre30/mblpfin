"use client";

import { useState } from "react";

type Plan = "monthly" | "annual";

function CheckIcon() {
  return <span className="text-amber-400 font-bold">✓</span>;
}
function CrossIcon() {
  return <span className="text-white/25">✕</span>;
}

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.getElementById("razorpay-script")) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.id = "razorpay-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay checkout"));
    document.body.appendChild(script);
  });
}

function PricingCard({
  label,
  price,
  sub,
  cta,
  highlight,
  loading,
  onCheckout,
}: {
  label: string;
  price: string;
  sub: string;
  cta: string;
  highlight?: boolean;
  loading: boolean;
  onCheckout: () => void;
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
        onClick={onCheckout}
        disabled={loading}
        className={`w-full rounded-xl py-3 text-sm font-semibold transition mt-auto disabled:opacity-60 disabled:cursor-not-allowed ${
          highlight
            ? "bg-amber-500 hover:bg-amber-400 text-black"
            : "bg-white/10 hover:bg-white/15 text-white border border-white/15"
        }`}
      >
        {loading ? "Processing…" : cta}
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
    a: "Yes. You can cancel your subscription at any time from your account settings. You'll retain Pro access until the end of your billing period.",
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

export default function PricingClient() {
  const [loadingPlan, setLoadingPlan] = useState<Plan | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout(plan: Plan) {
    setLoadingPlan(plan);
    setError(null);

    try {
      const res = await fetch("/api/razorpay/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to start checkout — please try again.");
        setLoadingPlan(null);
        return;
      }

      await loadRazorpayScript();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rzp = new (window as any).Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        subscription_id: data.subscriptionId,
        name: "MrBottomLine",
        description:
          plan === "monthly" ? "Pro Monthly — ₹199/month" : "Pro Annual — ₹899/year",
        theme: { color: "#F59E0B" },
        handler: () => {
          window.location.href = "/tracker?upgraded=true";
        },
      });

      rzp.open();
    } catch {
      setError("Something went wrong — please try again.");
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <div className="space-y-16">
      {/* Pricing cards */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-xl mx-auto">
          <PricingCard
            label="Monthly"
            price="₹199"
            sub="/month"
            cta="Get Started — ₹199/month"
            loading={loadingPlan === "monthly"}
            onCheckout={() => handleCheckout("monthly")}
          />
          <PricingCard
            label="Annual"
            price="₹899"
            sub="₹75/month · billed yearly"
            cta="Get Started — ₹899/year"
            highlight
            loading={loadingPlan === "annual"}
            onCheckout={() => handleCheckout("annual")}
          />
        </div>

        {error && (
          <p className="text-center text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3 max-w-xl mx-auto">
            {error}
          </p>
        )}
      </div>

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
          onClick={() => handleCheckout("annual")}
          disabled={loadingPlan !== null}
          className="bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm rounded-xl px-8 py-3 transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loadingPlan === "annual" ? "Processing…" : "Upgrade Now →"}
        </button>
      </div>
    </div>
  );
}
