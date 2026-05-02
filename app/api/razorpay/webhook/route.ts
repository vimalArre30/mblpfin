import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyWebhookSignature, classifyPlanId } from "@/lib/razorpay";

export const runtime = "nodejs";

/**
 * Razorpay subscription webhook.
 *
 * Reads the raw body BEFORE parsing for HMAC verification.
 * Uses the service-role Supabase client to bypass RLS.
 *
 * Handles:
 *  - subscription.activated   → plan = pro, plan_expires_at = current_end, status = active
 *  - subscription.charged     → plan_expires_at refreshed each renewal
 *  - subscription.cancelled   → mark cancel_requested_at; downgrade is date-driven via isProActive
 *  - subscription.completed   → plan = free, status = expired (full term naturally ended)
 *  - subscription.halted      → status = halted (failed payment after retries)
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  if (!signature) {
    return NextResponse.json({ error: "missing signature" }, { status: 401 });
  }

  let valid = false;
  try {
    valid = verifyWebhookSignature(rawBody, signature);
  } catch (e) {
    console.error("[razorpay/webhook] verify error:", e);
    return NextResponse.json({ error: "verify failed" }, { status: 500 });
  }

  if (!valid) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let payload: {
    event: string;
    payload: { subscription: { entity: SubEntity } };
  };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const event = payload.event;
  const sub = payload.payload?.subscription?.entity;

  if (!sub) {
    // Not a subscription event; ack and move on
    return NextResponse.json({ received: true });
  }

  const userId = sub.notes?.user_id;
  if (!userId) {
    console.warn("[razorpay/webhook] subscription has no user_id in notes:", sub.id);
    return NextResponse.json({ received: true });
  }

  const supabase = createAdminClient();
  const { isDiscount } = classifyPlanId(sub.plan_id);

  switch (event) {
    case "subscription.activated":
    case "subscription.charged": {
      const expiresAtMs = (sub.current_end ?? sub.charge_at ?? 0) * 1000;
      const update: Record<string, unknown> = {
        plan: "pro",
        plan_expires_at: expiresAtMs ? new Date(expiresAtMs).toISOString() : null,
        subscription_id: sub.id,
        subscription_status: "active",
        updated_at: new Date().toISOString(),
      };
      // If this is the discount-plan subscription kicking in (post-swap), record it
      if (isDiscount && event === "subscription.activated") {
        update.discount_applied = true;
        update.cancel_requested_at = null; // discount swap clears cancel state
      }
      await supabase.from("user_profiles").update(update).eq("user_id", userId);
      break;
    }

    case "subscription.cancelled": {
      // Only mark as cancelling — actual downgrade happens when expired event fires
      await supabase
        .from("user_profiles")
        .update({
          cancel_requested_at: new Date().toISOString(),
          subscription_status: "cancelling",
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("subscription_id", sub.id); // only update if this is still their active sub
      break;
    }

    case "subscription.completed": {
      await supabase
        .from("user_profiles")
        .update({
          plan: "free",
          plan_expires_at: null,
          subscription_id: null,
          cancel_requested_at: null,
          subscription_status: "expired",
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("subscription_id", sub.id);
      break;
    }

    case "subscription.halted": {
      await supabase
        .from("user_profiles")
        .update({
          subscription_status: "halted",
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("subscription_id", sub.id);
      break;
    }

    default:
      // Unhandled events: pending, paused, resumed, authenticated, etc.
      break;
  }

  return NextResponse.json({ received: true });
}

type SubEntity = {
  id: string;
  plan_id: string;
  status: string;
  current_start?: number;
  current_end?: number;
  charge_at?: number;
  notes?: { user_id?: string; [key: string]: string | undefined };
};
