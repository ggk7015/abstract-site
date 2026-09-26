import { NextResponse } from 'next/server';
import { currentUser } from './auth';
import { HAS_DB } from './db';
import { safeError } from './redact';

export const DB_MISSING =
  '尚未設定 DATABASE_URL。請在 Vercel 專案的 Storage 建立 Postgres 後重新部署。';

/**
 * 資訊安全需求：所有錯誤回應都必須經過 safeError()，
 * 確保資料庫連線字串 / token 不會出現在 HTTP body。
 */
export function apiError(err: unknown, status: number, fallback = 'internal error') {
  return NextResponse.json({ ok: false, error: safeError(err) || fallback }, { status });
}

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
