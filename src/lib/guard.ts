import { NextResponse } from 'next/server';
import { currentUser } from './auth';
import { HAS_DB } from './db';

export const DB_MISSING =
  '尚未設定 DATABASE_URL。請在 Vercel 專案的 Storage 建立 Postgres 後重新部署。';

export async function requireDb() {
  if (!HAS_DB) {
    return { ok: false as const, response: NextResponse.json({ error: DB_MISSING }, { status: 503 }) };
  }
  return { ok: true as const, response: null };
}

export async function requireUser() {
  if (!HAS_DB) {
    return { user: null, error: NextResponse.json({ error: DB_MISSING }, { status: 503 }) };
  }
  const user = await currentUser();
  if (user) return { user, error: null };
  return { user: null, error: NextResponse.json({ error: 'unauthorized' }, { status: 401 }) };
}
