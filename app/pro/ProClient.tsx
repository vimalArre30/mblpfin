"use client";

import { useState } from "react";
import { startSubscriptionCheckout } from "@/lib/razorpay-checkout";

const PRO_BENEFITS = [
  "Unlimited entries",
  "Voice + AI input",
  "Full analytics",
  "Multi-wallet",
  "Need / Want tagging",
  "Monthly summaries",
  "Priority support",
];

const COMPARISON: { feature: string; free: string; pro: string }[] = [
  { feature: "Entries", free: "250", pro: "Unlimited" },
  { feature: "Voice + AI input", free: "✓", pro: "✓" },
  { feature: "Dashboard", free: "✓", pro: "✓" },
  { feature: "Multi-wallet", free: "✓", pro: "✓" },
  { feature: "Analytics", free: "Basic", pro: "Full" },
  { feature: "Data export", free: "—", pro: "Coming soon" },
  { feature: "Budget planner", free: "—", pro: "Coming soon" },
  { feature: "Priority support", free: "—", pro: "✓" },
];

const FAQS = [
  {
    q: "What happens to my 250 free entries if I don't upgrade?",
    a: "They are completely safe. You can always view and browse your existing entries — you just won't be able to add new ones until you upgrade.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. You can cancel your subscription at any time from this page. You'll retain Pro access until the end of your billing period.",
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

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/* ---------------------------------------------------------------------- *
 * Top-level switch
 * ---------------------------------------------------------------------- */
export default function ProClient({
  state,
  planExpiresAt,
  discountApplied,
  entryCount,
  interval,
  userEmail,
  userName,
  justSubscribed,
}: {
  state: "free" | "pro" | "cancelling" | "halted";
  planExpiresAt: string | null;
  discountApplied: boolean;
  entryCount: number;
  interval: "monthly" | "annual" | null;
  userEmail?: string;
  userName?: string;
  justSubscribed: boolean;
}) {
  // Only show the welcome banner if the user JUST subscribed AND is currently on Pro.
  // (Without this guard, a user who cancels right after subscribing would still see the
  // celebratory banner on the cancelled-state page because ?welcome=1 sticks in the URL.)
  const showWelcomeBanner = justSubscribed && state === "pro";

  return (
    <>
      {/* Top nav — back to tracker */}
      <div className="-mt-6 sm:-mt-10 mb-2">
        <a
          href="/tracker/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white/80 transition"
        >
          <span aria-hidden>←</span> Back to Dashboard
        </a>
      </div>

      {/* Hero */}
      <div className="text-center">
        <h1 className="font-playfair text-3xl sm:text-4xl font-bold text-white mb-3">
          MrBottomLine Pro
        </h1>
        <p className="text-white/50 text-base sm:text-lg">
          Track without limits. Unlimited entries, full analytics, voice + AI input.
        </p>
      </div>

      {showWelcomeBanner && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-6 py-5 text-center">
          <p className="font-semibold text-emerald-300">Welcome to Pro 🎉</p>
          <p className="text-sm text-emerald-300/70 mt-1">
            Your subscription is being activated. This page will refresh in a moment.
          </p>
        </div>
      )}

      {state === "free" && (
        <FreeState prefill={{ name: userName, email: userEmail }} entryCount={entryCount} />
      )}
      {state === "pro" && (
        <ProState
          planExpiresAt={planExpiresAt}
          discountApplied={discountApplied}
          interval={interval}
        />
      )}
      {state === "cancelling" && (
        <CancellingState planExpiresAt={planExpiresAt} interval={interval} />
      )}
      {state === "halted" && <HaltedState />}
    </>
  );
}

/* ---------------------------------------------------------------------- *
 * State 1 — Free
 * ---------------------------------------------------------------------- */
function FreeState({
  prefill,
  entryCount,
}: {
  prefill: { name?: string; email?: string };
  entryCount: number;
}) {
  const [loading, setLoading] = useState<"monthly" | "annual" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function subscribe(interval: "monthly" | "annual") {
    setError(null);
    setLoading(interval);
    try {
      await startSubscriptionCheckout({ interval, prefill });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(null);
    }
  }

  return (
    <>
      {entryCount > 0 && (
        <div className="text-center text-sm text-white/40">
          You&apos;ve used {entryCount} of 250 free entries
        </div>
      )}

      {/* Pricing cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-xl mx-auto">
        <PricingCard
          label="Monthly"
          price="₹199"
          sub="/month"
          cta="Get Started — ₹199/month"
          loading={loading === "monthly"}
          onClick={() => subscribe("monthly")}
        />
        <PricingCard
          label="Annual"
          price="₹899"
          sub="₹75/month · billed yearly"
          cta="Get Started — ₹899/year"
          highlight
          loading={loading === "annual"}
          onClick={() => subscribe("annual")}
        />
      </div>

      {error && (
        <div className="max-w-xl mx-auto px-5 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm text-center">
          {error}
        </div>
      )}

      {/* Comparison */}
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
              <p className={`text-center ${free === "—" ? "text-white/25" : "text-white/50"}`}>
                {free}
              </p>
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
            <div key={q} className="bg-white/4 border border-white/10 rounded-xl px-5 py-4">
              <p className="text-sm font-medium text-white mb-1.5">{q}</p>
              <p className="text-sm text-white/50 leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* ---------------------------------------------------------------------- *
 * State 2 — Pro (active)
 * ---------------------------------------------------------------------- */
function ProState({
  planExpiresAt,
  discountApplied,
  interval,
}: {
  planExpiresAt: string | null;
  discountApplied: boolean;
  interval: "monthly" | "annual" | null;
}) {
  const [showCancelFlow, setShowCancelFlow] = useState(false);

  return (
    <>
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-emerald-400 text-xs uppercase tracking-wider font-semibold mb-1">
              ✓ You&apos;re on Pro
            </p>
            <p className="text-2xl font-bold text-white leading-tight">
              {interval === "annual" ? "Annual" : "Monthly"} plan
            </p>
            <p className="text-sm text-white/60 mt-2">
              Renews on {fmtDate(planExpiresAt)}
            </p>
          </div>
          {discountApplied && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 whitespace-nowrap">
              15% loyalty discount
            </span>
          )}
        </div>
      </div>

      {/* Benefits */}
      <BenefitsList />

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <a
          href={`mailto:hello@mrbottomline.club?subject=Update payment method`}
          className="flex-1 text-center rounded-xl py-3 text-sm font-medium bg-white/8 hover:bg-white/12 text-white border border-white/15 transition"
        >
          Update payment method
        </a>
        <button
          onClick={() => setShowCancelFlow(true)}
          className="flex-1 rounded-xl py-3 text-sm font-medium bg-transparent hover:bg-white/5 text-white/70 hover:text-white border border-white/15 transition"
        >
          Cancel subscription
        </button>
      </div>

      {showCancelFlow && (
        <CancelFlowModal
          planExpiresAt={planExpiresAt}
          discountApplied={discountApplied}
          interval={interval}
          onClose={() => setShowCancelFlow(false)}
        />
      )}
    </>
  );
}

/* ---------------------------------------------------------------------- *
 * State 3 — Cancelling
 * ---------------------------------------------------------------------- */
function CancellingState({
  planExpiresAt,
  interval,
}: {
  planExpiresAt: string | null;
  interval: "monthly" | "annual" | null;
}) {
  const [resuming, setResuming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function resume() {
    setError(null);
    setResuming(true);
    try {
      const res = await fetch("/api/razorpay/resume-subscription", { method: "POST" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.message ?? j.error ?? `Failed to resume subscription (${res.status})`);
      }
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setResuming(false);
    }
  }

  return (
    <>
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
        <p className="text-amber-400 text-xs uppercase tracking-wider font-semibold mb-1">
          ⚠ Subscription cancelled
        </p>
        <p className="text-2xl font-bold text-white leading-tight">
          {interval === "annual" ? "Annual" : "Monthly"} plan
        </p>
        <p className="text-sm text-white/60 mt-2">
          Pro access ends on {fmtDate(planExpiresAt)}
        </p>
        <p className="text-sm text-white/45 mt-1">
          After that, you&apos;ll be moved to Free (250-entry limit). Your data stays safe.
        </p>
      </div>

      <BenefitsList muted />

      <div>
        <button
          onClick={resume}
          disabled={resuming}
          className="w-full rounded-xl py-3 text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-black transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {resuming ? "Resuming…" : "Resume subscription"}
        </button>
        {error && (
          <p className="mt-3 text-center text-sm text-red-300">{error}</p>
        )}
      </div>
    </>
  );
}

/* ---------------------------------------------------------------------- *
 * State 4 — Halted (failed payment)
 * ---------------------------------------------------------------------- */
function HaltedState() {
  return (
    <>
      <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-6">
        <p className="text-red-400 text-xs uppercase tracking-wider font-semibold mb-1">
          🔴 Payment failed
        </p>
        <p className="text-2xl font-bold text-white leading-tight">
          Your last payment didn&apos;t go through
        </p>
        <p className="text-sm text-white/70 mt-2">
          Update your payment method to keep Pro access. Your subscription will be reactivated
          automatically once the payment succeeds.
        </p>
      </div>

      <BenefitsList muted />

      <a
        href={`mailto:hello@mrbottomline.club?subject=Payment failed&body=Please help me update my payment method.`}
        className="block w-full text-center rounded-xl py-3 text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-black transition"
      >
        Update payment method
      </a>
    </>
  );
}

/* ---------------------------------------------------------------------- *
 * Shared bits
 * ---------------------------------------------------------------------- */
function BenefitsList({ muted }: { muted?: boolean }) {
  return (
    <div>
      <h2 className="font-playfair text-xl font-semibold text-white mb-5 text-center">
        Pro benefits
      </h2>
      <ul className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${muted ? "opacity-60" : ""}`}>
        {PRO_BENEFITS.map((b) => (
          <li
            key={b}
            className="flex items-center gap-2.5 text-sm text-white/80 bg-white/4 border border-white/10 rounded-xl px-4 py-3"
          >
            <span className="text-amber-400 font-bold">✓</span>
            {b}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PricingCard({
  label,
  price,
  sub,
  cta,
  highlight,
  loading,
  onClick,
}: {
  label: string;
  price: string;
  sub: string;
  cta: string;
  highlight?: boolean;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <div
      className={`relative rounded-2xl border p-6 flex flex-col ${
        highlight ? "bg-amber-500/10 border-amber-500/40" : "bg-white/5 border-white/12"
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
        onClick={onClick}
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

/* ---------------------------------------------------------------------- *
 * 3-step Cancel Flow modal
 * ---------------------------------------------------------------------- */
function CancelFlowModal({
  planExpiresAt,
  discountApplied,
  interval,
  onClose,
}: {
  planExpiresAt: string | null;
  discountApplied: boolean;
  interval: "monthly" | "annual" | null;
  onClose: () => void;
}) {
  // Skip step 2 entirely if the user already used the discount
  type Step = 1 | 2 | 3;
  const [step, setStep] = useState<Step>(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextFromStep1 = () => setStep(discountApplied ? 3 : 2);

  const discountPrice = interval === "annual" ? "₹764/yr" : "₹169/mo";
  const fullPrice = interval === "annual" ? "₹899/yr" : "₹199/mo";
  const annualSavings = interval === "annual" ? "₹135/yr" : "₹30/mo";

  async function applyDiscount() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/razorpay/swap-to-discount", { method: "POST" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.message ?? j.error ?? `Failed to apply discount (${res.status})`);
      }
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setBusy(false);
    }
  }

  async function confirmCancel() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/razorpay/cancel-subscription", { method: "POST" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.message ?? j.error ?? `Failed to cancel subscription (${res.status})`);
      }
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center px-4">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      <div className="relative w-full sm:w-[480px] bg-[#0F1E40] border border-white/12 rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 pt-5 pb-3">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1 w-8 rounded-full transition ${
                s <= step ? "bg-amber-500" : "bg-white/15"
              }`}
            />
          ))}
        </div>

        <div className="px-6 pb-7">
          {step === 1 && (
            <>
              <h3 className="font-playfair text-xl font-bold text-white mb-3 text-center">
                Wait — here&apos;s what you&apos;ll lose
              </h3>
              <ul className="space-y-2.5 mb-6 text-sm text-white/70">
                <li className="flex items-start gap-2">
                  <span className="text-red-400">✕</span>
                  <span>Unlimited entries — Free caps at 250</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400">✕</span>
                  <span>AI insights & full analytics</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400">✕</span>
                  <span>Voice input, multi-wallet, priority support</span>
                </li>
              </ul>
              <p className="text-xs text-white/40 text-center mb-5">
                Your data stays safe — nothing gets deleted.
              </p>
              <button
                onClick={onClose}
                className="w-full rounded-xl py-3 text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-black transition mb-3"
              >
                Keep Pro
              </button>
              <button
                onClick={nextFromStep1}
                className="w-full text-center text-sm text-white/50 hover:text-white/70 py-2"
              >
                Continue cancelling →
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <h3 className="font-playfair text-xl font-bold text-white mb-3 text-center">
                Stay for 15% less — forever
              </h3>
              <div className="text-center mb-5">
                <p className="text-sm text-white/40 line-through">{fullPrice}</p>
                <p className="text-3xl font-bold text-amber-400 mt-1">{discountPrice}</p>
                <p className="text-sm text-white/60 mt-1.5">
                  Save {annualSavings} · applied to every renewal
                </p>
              </div>
              <p className="text-xs text-white/40 text-center mb-5 leading-relaxed">
                Discount kicks in on your next billing cycle ({fmtDate(planExpiresAt)}).
              </p>
              <button
                onClick={applyDiscount}
                disabled={busy}
                className="w-full rounded-xl py-3 text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-black transition mb-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {busy ? "Applying…" : "Apply 15% off"}
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={busy}
                className="w-full text-center text-sm text-white/50 hover:text-white/70 py-2 disabled:opacity-50"
              >
                No thanks, cancel
              </button>
            </>
          )}

          {step === 3 && (
            <>
              <h3 className="font-playfair text-xl font-bold text-white mb-3 text-center">
                Confirm cancellation
              </h3>
              <div className="space-y-2.5 mb-5 text-sm text-white/70">
                <p>You&apos;ll keep Pro access until <strong className="text-white">{fmtDate(planExpiresAt)}</strong>.</p>
                <p>After that, your account moves to Free (250-entry limit).</p>
                <p className="text-white/45">Your data is safe — nothing gets deleted.</p>
              </div>
              <button
                onClick={() => setStep(discountApplied ? 1 : 2)}
                disabled={busy}
                className="w-full rounded-xl py-3 text-sm font-medium bg-white/8 hover:bg-white/12 text-white border border-white/15 transition mb-3 disabled:opacity-50"
              >
                Go back
              </button>
              <button
                onClick={confirmCancel}
                disabled={busy}
                className="w-full rounded-xl py-3 text-sm font-semibold bg-red-500 hover:bg-red-400 text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {busy ? "Cancelling…" : "Cancel my subscription"}
              </button>
            </>
          )}

          {error && (
            <p className="mt-4 text-center text-sm text-red-300">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
