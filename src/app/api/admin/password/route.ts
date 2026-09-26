import { NextResponse } from 'next/server';
import { requireUser, apiError } from '@/lib/guard';
import { changePassword, clearSessionCookie } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 變更管理員密碼。
 *
 * 資訊安全需求：必須提供目前密碼；成功後撤銷**所有** session 並清除本機
 * cookie，強制所有裝置重新登入。密碼永不進日誌或錯誤訊息。
 */
export async function POST(request: Request) {
  const { user, error } = await requireUser();
  if (error) return error;

  const raw = (await request.json().catch(() => ({}))) as { current?: unknown; next?: unknown };
  if (typeof raw.current !== 'string' || typeof raw.next !== 'string') {
    return NextResponse.json({ error: '需要提供目前密碼與新密碼' }, { status: 400 });
  }

  try {
    const result = await changePassword(user!.id, raw.current, raw.next);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    await clearSessionCookie();
    return NextResponse.json({ ok: true, reauth: true });
  } catch (err) {
    return apiError(err, 500, 'failed to change password');
  }
}
