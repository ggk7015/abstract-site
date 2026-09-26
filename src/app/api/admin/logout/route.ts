import { NextResponse } from 'next/server';
import { clearSessionCookie, destroySession, currentUser } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  const user = await currentUser();
  if (user) {
    const { cookies } = await import('next/headers');
    const token = (await cookies()).get('abs_session')?.value;
    if (token) await destroySession(token);
  }
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
