import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  FREE_ENTRY_LIMIT,
  getUserPlan,
  incrementEntryCount,
  isAtFreeLimit,
} from "@/lib/tracker/plan";

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Plan / limit check
  let profile = await getUserPlan(supabase, user.id);

  if (!profile) {
    // First-time user — seed a blank profile row
    await supabase.from("user_profiles").insert({
      user_id: user.id,
      plan: "free",
      entry_count: 0,
    });
    profile = { plan: "free", plan_expires_at: null, entry_count: 0 };
  }

  if (isAtFreeLimit(profile)) {
    return NextResponse.json(
      { error: "limit_reached", entry_count: profile.entry_count, limit: FREE_ENTRY_LIMIT },
      { status: 402 }
    );
  }

  let body: {
    wallet_id?: string | null;
    category_id?: string | null;
    amount?: number;
    description?: string;
    date?: string;
    entry_type?: string;
    note?: string | null;
    label_ids?: string[];
    spending_type?: string | null;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { wallet_id, category_id, amount, description, date, entry_type, note, label_ids, spending_type } = body;

  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
    return NextResponse.json({ error: "amount is required and must be positive" }, { status: 400 });
  }

  const parsedAmount = Number(amount);
  const noteValue = note?.trim() || null;

  const { data: tx, error: txError } = await supabase
    .from("transactions")
    .insert({
      user_id: user.id,
      wallet_id: wallet_id || null,
      category_id: category_id || null,
      amount: parsedAmount,
      description: description?.trim() ?? "",
      date: date ?? new Date().toISOString().split("T")[0],
      entry_type: entry_type ?? "expense",
      type: entry_type === "income" ? "credit" : "debit",
      is_opening_balance: false,
      spending_type: entry_type === 'expense' ? (spending_type ?? null) : null,
      ...(noteValue ? { note: noteValue } : {}),
    })
    .select("id")
    .single();

  if (txError) {
    console.error("[transactions] insert error:", txError);
    return NextResponse.json({ error: txError.message }, { status: 500 });
  }

  // Insert labels
  if (label_ids && label_ids.length > 0 && tx) {
    await supabase.from("transaction_labels").insert(
      label_ids.map((lid) => ({ transaction_id: tx.id, label_id: lid }))
    );
  }

  // Increment entry count
  await incrementEntryCount(supabase, user.id, profile.entry_count);

  return NextResponse.json({ id: tx.id }, { status: 201 });
}
