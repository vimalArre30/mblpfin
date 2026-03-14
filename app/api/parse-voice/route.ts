import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const TRANSFER_SYSTEM_TEMPLATE = `You are a financial assistant. The user has just spoken a transfer instruction.
Extract the following from their transcript and return ONLY valid JSON:
{
  "entry_type": "transfer",
  "from_wallet": "<wallet name from the list or null>",
  "to_wallet": "<wallet name from the list or null>",
  "amount": <number, no currency symbols>
}

Available wallet names: {walletNames}

Match spoken wallet names to the closest name in the list (fuzzy, case-insensitive).
If amount is spoken as words, convert to number ("twenty thousand" → 20000).
Handle "₹", "rupees", "rs", or a bare number for the amount.

Examples:
- "transfer 20000 from mortgage to savings" → { "entry_type": "transfer", "from_wallet": "Mortgage", "to_wallet": "Savings", "amount": 20000 }
- "move 5000 from checking to credit card" → { "entry_type": "transfer", "from_wallet": "Checking Account", "to_wallet": "Credit Card", "amount": 5000 }

Return only the JSON object, no explanation, no markdown, no code blocks.`;

const SYSTEM_TEMPLATE = `You are an expense parsing assistant for an Indian personal finance app.

The user will give you a voice transcript describing a financial transaction.
Determine whether it is an income, expense, or wallet-to-wallet transfer. Then extract and return structured JSON.

For INCOME or EXPENSE entries, return:
{
  "entry_type": "income" | "expense",
  "amount": number,
  "description": string,
  "category": string,
  "wallet": string | null,
  "date": string,
  "note": string | null
}

For TRANSFER entries, return:
{
  "entry_type": "transfer",
  "amount": number,
  "from_wallet": string | null,
  "to_wallet": string | null,
  "date": string,
  "note": string | null
}

Field rules:
- entry_type: "income" if money was received (salary, freelance, dividend, refund etc.); "expense" if money was spent; "transfer" if money moved between wallets
- amount: required — extract from transcript; handle "₹", "rupees", "rs", or a bare number
- description: concise label for what was transacted (omit for transfers)
- category: match to one of the provided categories, or "Other" if no match (omit for transfers)
- wallet / from_wallet: match to one of the provided wallets by name, or null if unclear
- to_wallet: destination wallet for transfers, or null if unclear
- date: ISO date YYYY-MM-DD — use today's date unless a specific day is mentioned
- note: any extra context not captured above, or null

Examples:
- "received salary 50000" → entry_type: "income"
- "paid electricity bill 1200" → entry_type: "expense"
- "transfer 10000 from savings to mortgage" → entry_type: "transfer", from_wallet: "savings", to_wallet: "mortgage"

Return ONLY valid JSON. No explanation. No markdown. No code blocks.

Available categories: {categories}
Available wallets: {wallets}
Today's date: {today}`;

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === "your-key-here") {
    console.error("[parse-voice] ANTHROPIC_API_KEY not configured");
    return NextResponse.json(
      { error: "AI parsing is not configured. Add ANTHROPIC_API_KEY to .env.local." },
      { status: 500 }
    );
  }

  let body: { transcript?: string; categories?: string[]; wallets?: string[]; mode?: string; walletNames?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { transcript, categories = [], wallets = [], mode, walletNames = [] } = body;

  if (!transcript?.trim()) {
    return NextResponse.json({ error: "No transcript provided" }, { status: 400 });
  }

  const today = new Date().toISOString().split("T")[0];

  const systemPrompt = mode === "transfer"
    ? TRANSFER_SYSTEM_TEMPLATE.replace(
        "{walletNames}",
        walletNames.length ? walletNames.join(", ") : "None provided"
      )
    : SYSTEM_TEMPLATE
        .replace("{categories}", categories.length ? categories.join(", ") : "Food, Travel, Utilities, Health, Entertainment, Shopping, Investment, Other")
        .replace("{wallets}", wallets.length ? wallets.join(", ") : "None provided")
        .replace("{today}", today);

  console.log("[parse-voice] transcript:", transcript);

  const client = new Anthropic();

  // 10-second timeout via AbortSignal
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await client.messages.create(
      {
        model: "claude-opus-4-6",
        max_tokens: 300,
        system: systemPrompt,
        messages: [{ role: "user", content: transcript }],
      },
      { signal: controller.signal }
    );

    clearTimeout(timeout);

    const block = response.content[0];
    if (block.type !== "text") {
      throw new Error("Unexpected response content type");
    }

    const rawText = block.text.trim();
    console.log("[parse-voice] raw response:", rawText);

    const parsed = JSON.parse(rawText);
    console.log("[parse-voice] parsed:", parsed);

    // Validate required amount field
    if (parsed.amount === undefined || parsed.amount === null) {
      return NextResponse.json(
        { error: "no_amount", message: "Couldn't find an amount — please fill it in" },
        { status: 422 }
      );
    }

    return NextResponse.json(parsed);
  } catch (err) {
    clearTimeout(timeout);

    if (err instanceof Error && err.name === "AbortError") {
      console.error("[parse-voice] timed out");
      return NextResponse.json({ error: "Request timed out — please try again" }, { status: 504 });
    }

    if (err instanceof SyntaxError) {
      console.error("[parse-voice] JSON parse failed:", err.message);
      return NextResponse.json(
        { error: "Couldn't parse AI response — please fill in manually" },
        { status: 422 }
      );
    }

    if (err instanceof Anthropic.AuthenticationError) {
      console.error("[parse-voice] invalid API key");
      return NextResponse.json({ error: "Invalid API key" }, { status: 500 });
    }

    console.error("[parse-voice] unexpected error:", err);
    return NextResponse.json({ error: "Parsing failed — please try again" }, { status: 500 });
  }
}
