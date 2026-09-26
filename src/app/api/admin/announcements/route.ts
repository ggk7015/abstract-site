import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/guard';
import { create } from '@/lib/announcements';
import { parseAnnouncementInput } from '@/lib/announcement-input';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const { user, error } = await requireUser();
  if (error) return error;

  const raw = await request.json().catch(() => ({}));
  const created = await create(parseAnnouncementInput(raw, user!.username));
  return NextResponse.json({ ok: true, announcement: created }, { status: 201 });
}
