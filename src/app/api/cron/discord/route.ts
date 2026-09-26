import { NextResponse } from 'next/server';
import { HAS_DB } from '@/lib/db';
import { syncMessages, hasBotToken } from '@/lib/discord';
import { apiError } from '@/lib/guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const CRON_SECRET = process.env.CRON_SECRET || '';

/**
 * Pulls the latest Discord channel messages into the mirror table.
 * Called by Vercel Cron (vercel.json) or any external scheduler:
 *   GET|POST /api/cron/discord    header: authorization: Bearer <CRON_SECRET>
 *   GET      /api/cron/discord?key=<CRON_SECRET>
 */
async function handle(request: Request) {
  // 資訊安全需求：先驗證身分，再透露任何設定狀態，避免未授權者探測組態。
  const auth = request.headers.get('authorization') || '';
  const key = new URL(request.url).searchParams.get('key') || '';
  if (auth !== `Bearer ${CRON_SECRET}` && key !== CRON_SECRET) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  if (!CRON_SECRET) {
    return NextResponse.json({ ok: false, error: 'cron disabled' }, { status: 503 });
  }
  if (!HAS_DB) {
    return NextResponse.json({ ok: false, error: 'database not configured' }, { status: 503 });
  }
  if (!hasBotToken()) {
    return NextResponse.json({ ok: false, error: 'bot token not configured' }, { status: 503 });
  }

  try {
    const result = await syncMessages(100);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return apiError(err, 502, 'discord sync failed');
  }
}

export const GET = handle;
export const POST = handle;
