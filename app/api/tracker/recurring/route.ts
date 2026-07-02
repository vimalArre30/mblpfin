import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserPlan, isAtFreeLimit, incrementEntryCount } from "@/lib/tracker/plan";

// ── GET /api/tracker/recurring ────────────────────────────────
// Returns all recurring templates for the authenticated user,
// including their labels and last-created transaction date.
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("recurring_transactions")
    .select(`
      *,
      recurring_transaction_labels ( label_id, labels ( id, name, color ) )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

// ── POST /api/tracker/recurring ───────────────────────────────
// Creates a new recurring template.
// Body: { amount, entry_type, description, note?, wallet_id?, category_id?,
//         day_of_month, start_month, end_month?, label_ids?,
//         create_for_current_month? }
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: {
    amount?: number;
    entry_type?: string;
    description?: string;
    note?: string;
    wallet_id?: string;
    category_id?: string;
    day_of_month?: number;
    start_month?: string;       // "YYYY-MM-DD" (first of month)
    end_month?: string | null;
    label_ids?: string[];
    create_for_current_month?: boolean; // user's answer to the retroactive prompt
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const {
    amount, entry_type, description, note,
    wallet_id, category_id,
    day_of_month, start_month, end_month,
    label_ids = [],
    create_for_current_month = false,
  } = body;

  // Validation
  if (!amount || Number(amount) <= 0)
    return NextResponse.json({ error: "amount must be positive" }, { status: 400 });
  if (!entry_type || !["income", "expense"].includes(entry_type))
    return NextResponse.json({ error: "entry_type must be income or expense" }, { status: 400 });
  if (!day_of_month || day_of_month < 1 || day_of_month > 28)
    return NextResponse.json({ error: "day_of_month must be 1–28" }, { status: 400 });
  if (!start_month)
    return NextResponse.json({ error: "start_month is required" }, { status: 400 });

  // Insert template
  const { data: recurring, error: rErr } = await supabase
    .from("recurring_transactions")
    .insert({
      user_id:      user.id,
      wallet_id:    wallet_id    || null,
      category_id:  category_id  || null,
      amount:       Number(amount),
      entry_type,
      description:  description?.trim() ?? "",
      note:         note?.trim()        || null,
      day_of_month,
      start_month,
      end_month:    end_month    || null,
      is_active:    true,
      updated_at:   new Date().toISOString(),
    })
    .select()
    .single();

  if (rErr) return NextResponse.json({ error: rErr.message }, { status: 500 });

  // Attach labels
  if (label_ids.length > 0) {
    await supabase.from("recurring_transaction_labels").insert(
      label_ids.map((lid) => ({ recurring_id: recurring.id, label_id: lid }))
    );
  }

  // Retroactive creation — if user chose to create for current month
  // AND day_of_month hasn't passed yet, or user explicitly said yes
  if (create_for_current_month) {
    const profile = await getUserPlan(supabase, user.id);
    if (profile && !isAtFreeLimit(profile)) {
      const today = new Date();
      const txDate = new Date(today.getFullYear(), today.getMonth(), day_of_month);
      const dateStr = txDate.toISOString().split("T")[0];

      const { error: txErr } = await supabase.from("transactions").insert({
        user_id:      user.id,
        wallet_id:    wallet_id   || null,
        category_id:  category_id || null,
        amount:       Number(amount),
        entry_type,
        type:         entry_type === "income" ? "credit" : "debit",
        description:  description?.trim() ?? "",
        note:         note?.trim()        || null,
        date:         dateStr,
        is_opening_balance: false,
        recurring_id: recurring.id,
      });

      if (!txErr) {
        await incrementEntryCount(supabase, user.id, profile.entry_count);
        // Attach labels to the transaction too
        if (label_ids.length > 0) {
          const { data: tx } = await supabase
            .from("transactions")
            .select("id")
            .eq("recurring_id", recurring.id)
            .eq("date", dateStr)
            .single();
          if (tx) {
            await supabase.from("transaction_labels").insert(
              label_ids.map((lid) => ({ transaction_id: tx.id, label_id: lid }))
            );
          }
        }
      }
    }
  }

  return NextResponse.json({ data: recurring });
}
