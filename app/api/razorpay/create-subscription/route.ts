import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSubscription, getPlanId, type PlanInterval } from "@/lib/razorpay";
import { getUserPlan, isProActive } from "@/lib/tracker/plan";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { interval?: PlanInterval };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const interval = body.interval;
  if (interval !== "monthly" && interval !== "annual") {
    return NextResponse.json({ error: "interval must be 'monthly' or 'annual'" }, { status: 400 });
  }

  // Guard: don't let already-Pro users create a duplicate subscription
  const profile = await getUserPlan(supabase, user.id);
  if (profile && isProActive(profile)) {
    return NextResponse.json(
      { error: "already_subscribed", message: "You're already on Pro" },
      { status: 409 }
    );
  }

  try {
    const sub = await createSubscription({
      planId: getPlanId(interval),
      userId: user.id,
      // Annual subs total_count = 5 years; monthly = 5 years × 12 = 60 cycles
      totalCount: interval === "annual" ? 5 : 60,
      notes: { interval, source: "pro_page" },
    });

    return NextResponse.json({
      subscription_id: sub.id,
      // key_id is needed by the frontend Razorpay JS SDK
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (e: unknown) {
    const err = e as { error?: { description?: string }; message?: string };
    console.error("[razorpay/create-subscription] error:", err);
    return NextResponse.json(
      { error: "razorpay_error", message: err?.error?.description ?? err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
