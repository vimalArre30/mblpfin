import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getRazorpay } from "@/lib/razorpay";

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { plan?: string };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { plan } = body;

  if (plan !== "monthly" && plan !== "annual") {
    return NextResponse.json(
      { error: "plan must be 'monthly' or 'annual'" },
      { status: 400 }
    );
  }

  const planId =
    plan === "monthly"
      ? process.env.RAZORPAY_PLAN_MONTHLY_ID
      : process.env.RAZORPAY_PLAN_ANNUAL_ID;

  if (!planId) {
    console.error(`[create-subscription] env var for ${plan} plan ID is not set`);
    return NextResponse.json(
      { error: "Subscription plan is not configured" },
      { status: 500 }
    );
  }

  try {
    const subscription = await getRazorpay().subscriptions.create({
      plan_id: planId,
      total_count: 120,
      quantity: 1,
      notes: { user_id: user.id },
    });

    return NextResponse.json({ subscriptionId: subscription.id });
  } catch (err) {
    console.error("[create-subscription] Razorpay error:", err);
    return NextResponse.json(
      { error: "Failed to create subscription — please try again" },
      { status: 500 }
    );
  }
}
