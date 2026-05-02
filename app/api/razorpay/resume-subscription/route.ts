import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchSubscription, createSubscription, getPlanId, classifyPlanId } from "@/lib/razorpay";
import { getUserPlan, isProActive } from "@/lib/tracker/plan";

export const runtime = "nodejs";

/**
 * Resume a cancelling/cancelled subscription.
 *
 *  - If still in grace period (cancel_requested_at set, plan_expires_at in future):
 *    Call Razorpay to undo the scheduled cancellation. Razorpay doesn't have a
 *    native "uncancel" — instead we check the sub status: if it's still 'active'
 *    we just clear our flags. If it's already 'cancelled' on their side, we
 *    create a new subscription on the same plan starting at the current period end.
 *
 *  - If already past expiry: create a fresh subscription (returns checkout info
 *    so the frontend can re-open Razorpay).
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
  if (!profile || !profile.subscription_id) {
    return NextResponse.json({ error: "no_subscription" }, { status: 400 });
  }

  // Case 1 — still in grace period
  if (isProActive(profile) && profile.cancel_requested_at) {
    try {
      const sub = await fetchSubscription(profile.subscription_id);
      if (sub.status === "active" || sub.status === "authenticated") {
        // Razorpay still considers it active — just clear our cancel flag locally
        await supabase
          .from("user_profiles")
          .update({
            cancel_requested_at: null,
            subscription_status: "active",
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);

        return NextResponse.json({ ok: true, mode: "cleared" });
      }

      // Razorpay already finalised cancellation → schedule a new sub
      const { interval, isDiscount } = classifyPlanId(sub.plan_id);
      if (!interval) {
        return NextResponse.json({ error: "unknown_plan" }, { status: 500 });
      }
      const newSub = await createSubscription({
        planId: getPlanId(interval, isDiscount),
        userId: user.id,
        startAt: sub.current_end ?? undefined,
        notes: { interval, source: "resume" },
      });

      return NextResponse.json({
        ok: true,
        mode: "scheduled",
        subscription_id: newSub.id,
        key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      });
    } catch (e: unknown) {
      const err = e as { error?: { description?: string }; message?: string };
      console.error("[razorpay/resume-subscription] error:", err);
      return NextResponse.json(
        { error: "razorpay_error", message: err?.error?.description ?? err?.message },
        { status: 500 }
      );
    }
  }

  // Case 2 — already past expiry → fresh checkout flow needed
  return NextResponse.json(
    { error: "expired", message: "Subscription has fully expired. Subscribe again from /pro." },
    { status: 410 }
  );
}
