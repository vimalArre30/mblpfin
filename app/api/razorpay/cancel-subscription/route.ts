import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cancelSubscription } from "@/lib/razorpay";
import { getUserPlan, isProActive } from "@/lib/tracker/plan";

export const runtime = "nodejs";

export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await getUserPlan(supabase, user.id);
  if (!profile || !isProActive(profile)) {
    return NextResponse.json({ error: "not_subscribed" }, { status: 400 });
  }

  if (!profile.subscription_id) {
    return NextResponse.json({ error: "no_subscription_id" }, { status: 400 });
  }

  if (profile.cancel_requested_at) {
    return NextResponse.json({ error: "already_cancelling" }, { status: 409 });
  }

  try {
    await cancelSubscription(profile.subscription_id, true);
  } catch (e: unknown) {
    const err = e as { error?: { description?: string }; message?: string };
    console.error("[razorpay/cancel-subscription] error:", err);
    return NextResponse.json(
      { error: "razorpay_error", message: err?.error?.description ?? err?.message },
      { status: 500 }
    );
  }

  // Optimistic DB update — webhook will confirm
  await supabase
    .from("user_profiles")
    .update({
      cancel_requested_at: new Date().toISOString(),
      subscription_status: "cancelling",
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  return NextResponse.json({
    ok: true,
    access_until: profile.plan_expires_at,
  });
}
