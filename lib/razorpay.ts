import Razorpay from "razorpay";
import { createHmac, timingSafeEqual } from "crypto";

/* ---------------------------------------------------------------------- *
 * Razorpay client (server-side only)
 * ---------------------------------------------------------------------- */
let _client: Razorpay | null = null;

export function razorpay(): Razorpay {
  if (_client) return _client;

  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    throw new Error("Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET env vars");
  }

  _client = new Razorpay({ key_id, key_secret });
  return _client;
}

/* ---------------------------------------------------------------------- *
 * Plan ID helpers
 * ---------------------------------------------------------------------- */
export type PlanInterval = "monthly" | "annual";

export const PLAN_AMOUNTS: Record<PlanInterval, number> = {
  monthly: 19900, // ₹199 in paise
  annual: 89900, // ₹899 in paise
};

export const PLAN_AMOUNTS_DISCOUNT: Record<PlanInterval, number> = {
  monthly: 16900, // ₹169 in paise
  annual: 76400, // ₹764 in paise
};

export function getPlanId(interval: PlanInterval, discount = false): string {
  if (discount) {
    const id =
      interval === "monthly"
        ? process.env.RAZORPAY_PLAN_MONTHLY_DISCOUNT_ID
        : process.env.RAZORPAY_PLAN_ANNUAL_DISCOUNT_ID;
    if (!id) throw new Error(`Missing RAZORPAY_PLAN_${interval.toUpperCase()}_DISCOUNT_ID`);
    return id;
  }
  const id =
    interval === "monthly"
      ? process.env.RAZORPAY_PLAN_MONTHLY_ID
      : process.env.RAZORPAY_PLAN_ANNUAL_ID;
  if (!id) throw new Error(`Missing RAZORPAY_PLAN_${interval.toUpperCase()}_ID`);
  return id;
}

/**
 * Reverse-lookup: given a plan_id from a webhook payload, figure out which
 * of our four plans it is. Used to detect discount-plan activations.
 */
export function classifyPlanId(planId: string): {
  interval: PlanInterval | null;
  isDiscount: boolean;
} {
  if (planId === process.env.RAZORPAY_PLAN_MONTHLY_ID) return { interval: "monthly", isDiscount: false };
  if (planId === process.env.RAZORPAY_PLAN_ANNUAL_ID) return { interval: "annual", isDiscount: false };
  if (planId === process.env.RAZORPAY_PLAN_MONTHLY_DISCOUNT_ID) return { interval: "monthly", isDiscount: true };
  if (planId === process.env.RAZORPAY_PLAN_ANNUAL_DISCOUNT_ID) return { interval: "annual", isDiscount: true };
  return { interval: null, isDiscount: false };
}

/* ---------------------------------------------------------------------- *
 * Webhook signature verification
 * ---------------------------------------------------------------------- */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("Missing RAZORPAY_WEBHOOK_SECRET env var");
  }

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");

  // timingSafeEqual requires equal-length buffers; bail early on mismatch length
  if (expected.length !== signature.length) return false;
  return timingSafeEqual(Buffer.from(expected, "utf8"), Buffer.from(signature, "utf8"));
}

/* ---------------------------------------------------------------------- *
 * Subscription helpers (thin wrappers around the SDK)
 * ---------------------------------------------------------------------- */
export async function createSubscription(opts: {
  planId: string;
  userId: string;
  totalCount?: number;
  startAt?: number;
  notes?: Record<string, string>;
}) {
  const { planId, userId, totalCount, startAt, notes } = opts;

  return razorpay().subscriptions.create({
    plan_id: planId,
    customer_notify: 1,
    total_count: totalCount ?? 12, // default 12 cycles (1 year monthly / 12 years annual)
    ...(startAt ? { start_at: startAt } : {}),
    notes: { user_id: userId, ...(notes ?? {}) },
  });
}

export async function cancelSubscription(subscriptionId: string, atCycleEnd = true) {
  return razorpay().subscriptions.cancel(subscriptionId, atCycleEnd);
}

export async function fetchSubscription(subscriptionId: string) {
  return razorpay().subscriptions.fetch(subscriptionId);
}
