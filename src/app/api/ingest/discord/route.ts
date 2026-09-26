import { NextResponse } from 'next/server';
import { storeIncoming, type DiscordMessage } from '@/lib/discord';
import { HAS_DB } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SECRET = process.env.INGEST_SECRET || '';

/**
 * Ingest endpoint for the Discord mirror.
 * Point a Discord bot (or the in-game plugin via a relay) at this URL:
 *   POST /api/ingest/discord   header: x-ingest-secret: <INGEST_SECRET>
 */
export async function POST(request: Request) {
  if (!SECRET) return NextResponse.json({ ok: false, error: 'ingest disabled' }, { status: 503 });
  if (!HAS_DB) return NextResponse.json({ ok: false, error: 'database not configured' }, { status: 503 });
  if (request.headers.get('x-ingest-secret') !== SECRET) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  let payload: Partial<DiscordMessage>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'bad json' }, { status: 400 });
  }

  if (!payload.id || !payload.content) {
    return NextResponse.json({ ok: false, error: 'missing id or content' }, { status: 400 });
  }

  const inserted = await storeIncoming({
    id: String(payload.id),
    channelId: String(payload.channelId ?? 'unknown'),
    channelName: payload.channelName ?? null,
    authorId: payload.authorId ?? null,
    authorName: payload.authorName ?? 'unknown',
    authorAvatar: payload.authorAvatar ?? null,
    authorBot: Boolean(payload.authorBot),
    content: String(payload.content).slice(0, 4000),
    createdAt: payload.createdAt ?? new Date().toISOString(),
  });

  return NextResponse.json({ ok: true, inserted });
}
