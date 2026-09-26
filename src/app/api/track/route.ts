import { NextResponse } from 'next/server';
import { db, HAS_DB } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Body = {
  path?: string;
  host?: string;
  visitorId?: string;
  device?: string;
  browser?: string;
  durationMs?: number;
};

const UUID_RE = /^[0-9a-f-]{36}$/i;

export async function POST(request: Request) {
  if (!HAS_DB) return new NextResponse(null, { status: 204 });

  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (!body.visitorId || !UUID_RE.test(body.visitorId)) {
    return NextResponse.json({ ok: false, error: 'invalid visitor' }, { status: 400 });
  }

  const path = (body.path || '/').slice(0, 200);
  const host = (body.host || '').slice(0, 200);
  const device = (body.device || '').slice(0, 40);
  const browser = (body.browser || '').slice(0, 40);
  const duration = Number.isFinite(body.durationMs) ? Math.min(Number(body.durationMs), 3_600_000) : null;

  try {
    const sql = db();
    await sql`
      INSERT INTO page_views (path, host, visitor_id, device, browser, duration_ms)
      VALUES (${path}, ${host}, ${body.visitorId}, ${device}, ${browser}, ${duration})`;
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
