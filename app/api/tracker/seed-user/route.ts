import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_CATEGORIES = [
  // ── Expense ──────────────────────────────────────────────────────────────
  { name: "Food",          icon: "🍔", type: "expense" },
  { name: "Transport",     icon: "🚗", type: "expense" },
  { name: "Health",        icon: "🏥", type: "expense" },
  { name: "Entertainment", icon: "🎬", type: "expense" },
  { name: "Utilities",     icon: "💡", type: "expense" },
  { name: "Shopping",      icon: "🛍️", type: "expense" },
  { name: "Other",         icon: "📦", type: "expense" },
  // ── Income ───────────────────────────────────────────────────────────────
  { name: "Salary",             icon: "💰", type: "income" },
  { name: "Freelance",          icon: "💻", type: "income" },
  { name: "Investment Returns", icon: "📈", type: "income" },
  { name: "Other Income",       icon: "💵", type: "income" },
];

const DEFAULT_LABELS = [
  { name: "Need",       color: "#2563EB" },
  { name: "Want",       color: "#D97706" },
  { name: "Investment", color: "#16A34A" },
];

export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Idempotency guard — skip if user already has categories
  const { count } = await supabase
    .from("categories")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (count && count > 0) {
    return NextResponse.json({ seeded: false, reason: "already seeded" });
  }

  // Insert default categories (with type)
  const { error: catError } = await supabase.from("categories").insert(
    DEFAULT_CATEGORIES.map((c) => ({ ...c, user_id: user.id }))
  );

  if (catError) {
    console.error("[seed-user] categories error:", catError.message);
    return NextResponse.json({ error: catError.message }, { status: 500 });
  }

  // Insert default labels
  const { error: lblError } = await supabase.from("labels").insert(
    DEFAULT_LABELS.map((l) => ({ ...l, user_id: user.id }))
  );

  if (lblError) {
    console.error("[seed-user] labels error:", lblError.message);
    return NextResponse.json({ error: lblError.message }, { status: 500 });
  }

  console.log(`[seed-user] Seeded defaults for user ${user.id}`);
  return NextResponse.json({ seeded: true });
}
