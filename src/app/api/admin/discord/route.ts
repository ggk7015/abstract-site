import { NextResponse } from 'next/server';
import { requireUser, apiError } from '@/lib/guard';
import { syncMessages, hasBotToken, recentMessages } from '@/lib/discord';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(request: Request) {
  const { error } = await requireUser();
  if (error) return error;

  const limit = Number(new URL(request.url).searchParams.get('limit') ?? 30);
  try {
    const messages = await recentMessages(Math.min(limit, 100));
    return NextResponse.json({ messages, botConfigured: hasBotToken() });
  } catch (err) {
    return apiError(err, 500, 'failed to load messages');
  }
}

export async function POST() {
  const { error } = await requireUser();
  if (error) return error;

  if (!hasBotToken()) {
    return NextResponse.json({ error: '尚未設定 DISCORD_BOT_TOKEN' }, { status: 400 });
  }
  try {
    const result = await syncMessages(50);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return apiError(err, 502, 'discord sync failed');
  }
}
