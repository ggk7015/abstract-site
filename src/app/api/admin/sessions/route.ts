import { NextResponse } from 'next/server';
import { requireUser, apiError } from '@/lib/guard';
import { listSessions, revokeOtherSessions, revokeSession } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** 列出所有有效 session。回應只含 token 前綴，完整憑證永不下發（見 auth.ts）。 */
export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;

  try {
    const sessions = await listSessions(user!.id);
    return NextResponse.json({ sessions });
  } catch (err) {
    return apiError(err, 500, 'failed to list sessions');
  }
}

/**
 * 撤銷 session。
 *
 *   DELETE /api/admin/sessions           → 撤銷其他所有 session（保留目前）
 *   DELETE /api/admin/sessions { id }     → 撤銷指定 session
 */
export async function DELETE(request: Request) {
  const { user, error } = await requireUser();
  if (error) return error;

  const raw = (await request.json().catch(() => ({}))) as { id?: unknown };

  try {
    if (typeof raw.id === 'string' && raw.id.length > 0) {
      const removed = (await revokeSession(user!.id, raw.id)) ? 1 : 0;
      return NextResponse.json({ ok: true, removed });
    }
    const removed = await revokeOtherSessions(user!.id);
    return NextResponse.json({ ok: true, removed });
  } catch (err) {
    return apiError(err, 500, 'failed to revoke session');
  }
}
