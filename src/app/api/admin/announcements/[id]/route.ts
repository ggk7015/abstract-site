import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/guard';
import { remove, update } from '@/lib/announcements';
import { parseAnnouncementInput } from '@/lib/announcement-input';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { user, error } = await requireUser();
  if (error) return error;

  const { id } = await params;
  const raw = await request.json().catch(() => ({}));
  const updated = await update(id, parseAnnouncementInput(raw, user!.username));
  if (!updated) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json({ ok: true, announcement: updated });
}

export async function DELETE(_request: Request, { params }: Params) {
  const { error } = await requireUser();
  if (error) return error;

  const { id } = await params;
  const ok = await remove(id);
  if (!ok) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
