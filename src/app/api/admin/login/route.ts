import { NextResponse } from 'next/server';
import { authenticate, createSession, ensureSeedAdmin, setSessionCookie } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const { username, password } = await request.json().catch(() => ({}));
  if (typeof username !== 'string' || typeof password !== 'string') {
    return NextResponse.json({ error: 'missing credentials' }, { status: 400 });
  }

  await ensureSeedAdmin();
  const user = await authenticate(username, password);
  if (!user) return NextResponse.json({ error: '帳號或密碼錯誤' }, { status: 401 });

  const token = await createSession(user.id);
  await setSessionCookie(token);
  return NextResponse.json({ ok: true, user });
}
