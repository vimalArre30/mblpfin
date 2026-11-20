/**
 * Client-side Razorpay Checkout helpers.
 *
 * The Razorpay JS SDK is loaded via a <Script> tag in app/layout.tsx (or per-page).
 * `window.Razorpay` becomes available after the script loads.
 */

import { track } from "@/lib/analytics/track";

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => {
      open: () => void;
      on?: (event: string, cb: (resp: unknown) => void) => void;
    };
  }
}

export type RazorpayCheckoutOptions = {
  key: string;
  subscription_id: string;
  name: string;
  description: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  handler?: (resp: {
    razorpay_payment_id: string;
    razorpay_subscription_id: string;
    razorpay_signature: string;
  }) => void;
  modal?: { ondismiss?: () => void; escape?: boolean; backdropclose?: boolean };
};

const PLAN_META = {
  monthly: { item_id: "pro_monthly", value: 199 },
  annual: { item_id: "pro_annual", value: 899 },
} as const;

/**
 * Lazy-load the Razorpay checkout script. Returns once window.Razorpay is ready.
 */
export function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("not in browser"));
    if (window.Razorpay) return resolve();

    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("razorpay script failed")));
      return;
    }

    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("razorpay script failed"));
    document.body.appendChild(s);
  });
}

/**
 * Full checkout flow: create subscription on server → open Razorpay modal.
 * Returns a Promise that resolves on payment success or rejects on cancellation/error.
 */
export async function startSubscriptionCheckout(opts: {
  interval: "monthly" | "annual";
  prefill?: { name?: string; email?: string };
  onSuccess?: () => void;
  onDismiss?: () => void;
}) {
  const { interval, prefill, onSuccess, onDismiss } = opts;
  const plan = PLAN_META[interval];

  // GA4 ecommerce: user clicked the subscribe CTA.
  track("begin_checkout", {
    currency: "INR",
    value: plan.value,
    items: [{ item_id: plan.item_id, item_name: "MBL PFin Pro", quantity: 1 }],
  });

  const res = await fetch("/api/razorpay/create-subscription", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ interval }),
  });

  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    if (res.status === 409 && j.error === "already_subscribed") {
      throw new Error("You're already on Pro");
    }
    if (res.status === 401) {
      window.location.href = "/tracker/login?next=/pro";
      return;
    }
    throw new Error(j.message ?? "Failed to start checkout");
  }

  const { subscription_id, key_id } = (await res.json()) as {
    subscription_id: string;
    key_id: string;
  };

  await loadRazorpayScript();

  if (!window.Razorpay) throw new Error("Razorpay SDK failed to load");

  let completed = false;

  const rzp = new window.Razorpay({
    key: key_id,
    subscription_id,
    name: "MBL PFin Pro",
    description: interval === "annual" ? "Annual subscription · ₹899/yr" : "Monthly subscription · ₹199/mo",
    prefill,
    theme: { color: "#F59E0B" },
    handler: (resp) => {
      completed = true;
      // GA4 purchase. The page is about to hard-navigate, so use the beacon
      // transport and give it a moment to flush. The Razorpay webhook remains
      // the source of truth for the subscription itself.
      track("purchase", {
        transaction_id: resp?.razorpay_payment_id,
        currency: "INR",
        value: plan.value,
        items: [{ item_id: plan.item_id, item_name: "MBL PFin Pro", quantity: 1 }],
        transport_type: "beacon",
      });
      // Webhook will update the DB; redirect to a "thanks" route that polls
      onSuccess?.();
      setTimeout(() => {
        window.location.href = "/pro?welcome=1";
      }, 400);
    },
    modal: {
      ondismiss: () => {
        if (!completed) {
          track("purchase_failed", { plan: plan.item_id, error_type: "dismissed" });
        }
        onDismiss?.();
      },
    },
  });

  rzp.on?.("payment.failed", () => {
    track("purchase_failed", { plan: plan.item_id, error_type: "failed" });
  });

  track("checkout_progress", { plan: plan.item_id, checkout_step: "razorpay_open" });
  rzp.open();
}
