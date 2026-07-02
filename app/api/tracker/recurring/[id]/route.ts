import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

// ── PATCH /api/tracker/recurring/[id] ────────────────────────
// Update a recurring template (amount, description, end_month, is_active).
// Past transactions are never touched — only future occurrences are affected.
export async function PATCH(req: NextRequest, { params }: Params) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  let body: {
    amount?: number;
    description?: string;
    note?: string;
    wallet_id?: string | null;
    category_id?: string | null;
    end_month?: string | null;
    is_active?: boolean;
    label_ids?: string[];
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { label_ids, ...fields } = body;

  // Build update payload — only include provided fields
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (fields.amount       !== undefined) update.amount       = Number(fields.amount);
  if (fields.description  !== undefined) update.description  = fields.description.trim();
  if (fields.note         !== undefined) update.note         = fields.note?.trim() || null;
  if (fields.wallet_id    !== undefined) update.wallet_id    = fields.wallet_id    || null;
  if (fields.category_id  !== undefined) update.category_id  = fields.category_id  || null;
  if (fields.end_month    !== undefined) update.end_month    = fields.end_month    || null;
  if (fields.is_active    !== undefined) update.is_active    = fields.is_active;

  const { data, error } = await supabase
    .from("recurring_transactions")
    .update(update)
    .eq("id", id)
    .eq("user_id", user.id) // RLS belt-and-braces
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Replace labels if provided
  if (label_ids !== undefined) {
    await supabase
      .from("recurring_transaction_labels")
      .delete()
      .eq("recurring_id", id);
    if (label_ids.length > 0) {
      await supabase.from("recurring_transaction_labels").insert(
        label_ids.map((lid) => ({ recurring_id: id, label_id: lid }))
      );
    }
  }

  return NextResponse.json({ data });
}

// ── DELETE /api/tracker/recurring/[id] ───────────────────────
// Deletes the template. Past transactions keep their recurring_id as null
// (FK is ON DELETE SET NULL) so history is preserved.
export async function DELETE(_req: NextRequest, { params }: Params) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const { error } = await supabase
    .from("recurring_transactions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
