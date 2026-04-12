import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

// ── Types ─────────────────────────────────────────────────────────────────────

type SubscriptionEntity = {
  id: string;
  current_end: number;
  notes?: Record<string, string | undefined>;
};

type RazorpayEvent = {
  event: string;
  payload: {
    subscription: {
      entity: SubscriptionEntity;
    };
  };
};

// ── Service-role Supabase client (bypasses RLS) ───────────────────────────────

function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Must read raw body before any parsing — signature is over the exact bytes
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";

  const expectedSig = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(rawBody)
    .digest("hex");

  if (signature !== expectedSig) {
    console.error("[webhook] signature mismatch — possible spoofed request");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: RazorpayEvent;

  try {
    event = JSON.parse(rawBody) as RazorpayEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const eventType = event.event;
  const subscription = event.payload?.subscription?.entity;

  console.log(`[webhook] received: ${eventType}`);

  // Unhandled events — acknowledge immediately so Razorpay does not retry
  if (
    eventType !== "subscription.activated" &&
    eventType !== "subscription.charged" &&
    eventType !== "subscription.cancelled" &&
    eventType !== "subscription.expired"
  ) {
    return NextResponse.json({ received: true });
  }

  const userId = subscription?.notes?.user_id;

  if (!userId) {
    console.error(
      `[webhook] ${eventType}: no user_id in subscription notes — cannot update plan`
    );
    // Still return 200 so Razorpay does not keep retrying an unresolvable event
    return NextResponse.json({ received: true });
  }

  const supabase = createServiceClient();

  if (eventType === "subscription.activated" || eventType === "subscription.charged") {
    // Activate pro or extend the billing period on renewal
    const planExpiresAt = new Date(subscription.current_end * 1000).toISOString();

    const { error } = await supabase
      .from("user_profiles")
      .update({
        plan: "pro",
        plan_expires_at: planExpiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (error) {
      console.error(`[webhook] ${eventType} — update error:`, error.message);
    } else {
      console.log(
        `[webhook] ${eventType}: user ${userId} upgraded to pro, expires ${planExpiresAt}`
      );
    }
  } else if (eventType === "subscription.cancelled") {
    // Do not downgrade immediately — user has paid for the current period.
    // isProActive() in lib/tracker/plan.ts will handle expiry automatically
    // once plan_expires_at passes, so no DB update is needed here.
    console.log(
      `[webhook] subscription.cancelled: user ${userId} retains pro access until plan_expires_at`
    );
  } else if (eventType === "subscription.expired") {
    // Billing period fully ended — revert to free
    const { error } = await supabase
      .from("user_profiles")
      .update({
        plan: "free",
        plan_expires_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (error) {
      console.error("[webhook] subscription.expired — update error:", error.message);
    } else {
      console.log(`[webhook] subscription.expired: user ${userId} reverted to free`);
    }
  }

  return NextResponse.json({ received: true });
}
