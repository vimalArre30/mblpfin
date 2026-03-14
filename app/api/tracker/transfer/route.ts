import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    fromWalletId?: string;
    toWalletId?: string;
    amount?: number;
    description?: string;
    date?: string;
    note?: string | null;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { fromWalletId, toWalletId, amount, description, date, note } = body;

  if (!fromWalletId || !toWalletId || !amount) {
    return NextResponse.json({ error: "fromWalletId, toWalletId, and amount are required" }, { status: 400 });
  }

  if (fromWalletId === toWalletId) {
    return NextResponse.json({ error: "Cannot transfer to the same wallet" }, { status: 400 });
  }

  const parsedAmount = Number(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return NextResponse.json({ error: "Amount must be a positive number" }, { status: 400 });
  }

  const transferId = crypto.randomUUID();
  const txDate = date ?? new Date().toISOString().split("T")[0];
  const txDescription = description?.trim() || "Transfer";

  const noteValue = note?.trim() || undefined;

  // Insert both legs atomically
  const { error } = await supabase.from("transactions").insert([
    {
      user_id: user.id,
      wallet_id: fromWalletId,
      amount: -parsedAmount,
      entry_type: "transfer",
      type: "debit",
      transfer_id: transferId,
      to_wallet_id: toWalletId,
      description: txDescription,
      date: txDate,
      ...(noteValue ? { note: noteValue } : {}),
    },
    {
      user_id: user.id,
      wallet_id: toWalletId,
      amount: parsedAmount,
      entry_type: "transfer",
      type: "credit",
      transfer_id: transferId,
      to_wallet_id: null,
      description: txDescription,
      date: txDate,
      ...(noteValue ? { note: noteValue } : {}),
    },
  ]);

  if (error) {
    console.error("[transfer] insert error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, transferId });
}
