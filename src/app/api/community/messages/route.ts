import { NextResponse } from 'next/server';
import { recentMessages } from '@/lib/discord';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const limit = Number(new URL(request.url).searchParams.get('limit') ?? 30);
  const messages = await recentMessages(Math.min(limit, 50));
  return NextResponse.json({ messages }, { headers: { 'cache-control': 'no-store' } });
}
