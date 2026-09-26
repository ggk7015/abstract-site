import { NextResponse } from 'next/server';
import { requireUser, apiError } from '@/lib/guard';
import { create, removeByStatus, removeMany } from '@/lib/announcements';
import { parseAnnouncementInput } from '@/lib/announcement-input';
import type { Announcement } from '@/lib/announcement-types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STATUSES: readonly Announcement['status'][] = ['draft', 'published', 'archived'];

export async function POST(request: Request) {
  const { user, error } = await requireUser();
  if (error) return error;

  const raw = await request.json().catch(() => ({}));
  const created = await create(parseAnnouncementInput(raw, user!.username));
  return NextResponse.json({ ok: true, announcement: created }, { status: 201 });
}

/**
 * 批次撤銷公告。
 *
 *   DELETE /api/admin/announcements { ids: [uuid, …] }  → 刪除指定清單
 *   DELETE /api/admin/announcements { status: 'draft' } → 刪除該狀態全部
 */
export async function DELETE(request: Request) {
  const { error } = await requireUser();
  if (error) return error;

  const raw = (await request.json().catch(() => ({}))) as { ids?: unknown; status?: unknown };

  const ids = Array.isArray(raw.ids)
    ? raw.ids.map(String).filter((id) => /^[0-9a-f-]{36}$/i.test(id)).slice(0, 500)
    : [];

  if (ids.length === 0 && !STATUSES.includes(raw.status as Announcement['status'])) {
    return NextResponse.json({ error: '需要提供 ids 或有效的 status' }, { status: 400 });
  }

  try {
    const removed = STATUSES.includes(raw.status as Announcement['status'])
      ? await removeByStatus(raw.status as Announcement['status'])
      : await removeMany(ids);
    return NextResponse.json({ ok: true, removed });
  } catch (err) {
    return apiError(err, 500, 'failed to delete announcements');
  }
}
