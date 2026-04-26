import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';

const client = new Anthropic();

export async function POST(req: NextRequest) {
  // Auth check
  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { type, walletName, categoryName, data } = body;

  let prompt = '';
  if (type === 'wallet') {
    prompt = `You are a personal finance assistant for an Indian user.
Wallet: "${walletName}"
Analytics summary (amounts in INR):
${JSON.stringify(data, null, 2)}

Write 2-3 sentences of plain-English insight about this wallet's spending patterns.
Mention the top category, any notable trend in the last 6 months, and the need/want ratio if tagged data exists.
Be specific with rupee amounts. Do not use markdown formatting.`;
  } else {
    prompt = `You are a personal finance assistant for an Indian user.
Category: "${categoryName}" in wallet "${walletName ?? 'All Wallets'}"
Analytics summary (amounts in INR):
${JSON.stringify(data, null, 2)}

Write 2-3 sentences of plain-English insight about spending in this category.
Mention the 6-month trend (increasing/decreasing/stable), total spend, and need/want ratio if available.
Be specific with rupee amounts. Do not use markdown formatting.`;
  }

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 150,
      messages: [{ role: 'user', content: prompt }],
    });

    const insight = (message.content[0] as { type: string; text: string }).text;
    return NextResponse.json({ insight });
  } catch (err) {
    console.error('[insights] Anthropic error:', err);
    return NextResponse.json({ error: 'Insight unavailable' }, { status: 500 });
  }
}
