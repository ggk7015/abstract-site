import { NextResponse } from 'next/server';
import { currentUser } from './auth';

export async function requireUser() {
  const user = await currentUser();
  if (user) return { user, error: null };
  return { user: null, error: NextResponse.json({ error: 'unauthorized' }, { status: 401 }) };
}
