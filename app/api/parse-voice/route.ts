import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const SYSTEM_TEMPLATE = `You are an expense parsing assistant for an Indian personal finance app.

The user will give you a voice transcript describing an expense.
Extract and return structured JSON with these fields:
- amount: number (required — extract from transcript; handle "₹", "rupees", "rs", or a bare number)
- description: string (required — concise label for what was spent on)
- category: string (match to one of the provided categories, or "Other" if no match)
- wallet: string or null (match to one of the provided wallets by name, or null if unclear)
- date: string (ISO date YYYY-MM-DD — use today's date unless a specific day is mentioned)
- note: string or null (any extra context from the transcript not captured above, or null)

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

  let body: { transcript?: string; categories?: string[]; wallets?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { transcript, categories = [], wallets = [] } = body;

  if (!transcript?.trim()) {
    return NextResponse.json({ error: "No transcript provided" }, { status: 400 });
  }

  const today = new Date().toISOString().split("T")[0];
  const systemPrompt = SYSTEM_TEMPLATE
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
        max_tokens: 256,
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

    // Validate that we got at least the required fields
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
