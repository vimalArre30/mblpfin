import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  cancelSubscription,
  createSubscription,
  fetchSubscription,
  getPlanId,
  classifyPlanId,
  PLAN_AMOUNTS_DISCOUNT,
} from "@/lib/razorpay";
import { getUserPlan, isProActive } from "@/lib/tracker/plan";

export const runtime = "nodejs";

/**
 * Plan-swap save flow:
 *  1. Cancel the current subscription at cycle end
 *  2. Create a new subscription on the discount plan starting at current period_end
 *  3. Mark discount_applied = true so we never offer the discount again
 */
export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await getUserPlan(supabase, user.id);
  if (!profile || !isProActive(profile) || !profile.subscription_id) {
    return NextResponse.json({ error: "not_subscribed" }, { status: 400 });
  }

  if (profile.discount_applied) {
    return NextResponse.json(
      { error: "discount_already_applied", message: "Loyalty discount already in effect" },
      { status: 409 }
    );
  }

  try {
    const currentSub = await fetchSubscription(profile.subscription_id);
    const { interval } = classifyPlanId(currentSub.plan_id);
    if (!interval) {
      return NextResponse.json({ error: "unknown_plan" }, { status: 500 });
    }

    const periodEnd = currentSub.current_end;
    if (!periodEnd) {
      return NextResponse.json({ error: "no_period_end" }, { status: 500 });
    }

    // Step 1 — cancel current sub at cycle end
    await cancelSubscription(profile.subscription_id, true);

    // Step 2 — create discount sub starting at period end
    const newSub = await createSubscription({
      planId: getPlanId(interval, true),
      userId: user.id,
      startAt: periodEnd,
      // mirror total_count from spec (annual: 5 cycles, monthly: 60)
      totalCount: interval === "annual" ? 5 : 60,
      notes: {
        interval,
        source: "discount_swap",
        swap_from: profile.subscription_id,
      },
    });

    // Step 3 — update DB. Webhook for the new sub.activated will confirm.
    // Note: subscription_id is updated to newSub.id immediately so subsequent
    // webhook events for the OLD sub (cancelled/expired) won't write to this row.
    await supabase
      .from("user_profiles")
      .update({
        subscription_id: newSub.id,
        discount_applied: true,
        cancel_requested_at: null,
        subscription_status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    return NextResponse.json({
      ok: true,
      new_subscription_id: newSub.id,
      new_amount_paise: PLAN_AMOUNTS_DISCOUNT[interval],
      starts_at: new Date(periodEnd * 1000).toISOString(),
    });
  } catch (e: unknown) {
    const err = e as { error?: { description?: string }; message?: string };
    console.error("[razorpay/swap-to-discount] error:", err);
    return NextResponse.json(
      { error: "razorpay_error", message: err?.error?.description ?? err?.message },
      { status: 500 }
    );
  }
}
