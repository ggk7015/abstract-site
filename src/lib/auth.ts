import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { db, HAS_DB } from './db';

const COOKIE = 'abs_session';
const MAX_AGE_S = 60 * 60 * 24 * 14;

export type AdminUser = { id: string; username: string };

export function hashPassword(plain: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(plain, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(plain: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const candidate = scryptSync(plain, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

export async function ensureSeedAdmin(): Promise<AdminUser | null> {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password) return null;
  const sql = db();
  const found = await sql<{ id: string; username: string }[]>`SELECT id, username FROM admin_users WHERE username = ${username}`;
  if (found[0]) return found[0];
  const created = await sql<{ id: string; username: string }[]>`
    INSERT INTO admin_users (username, password_hash) VALUES (${username}, ${hashPassword(password)})
    ON CONFLICT (username) DO UPDATE SET username = EXCLUDED.username
    RETURNING id, username`;
  return created[0] ?? null;
}

export async function authenticate(username: string, password: string): Promise<AdminUser | null> {
  const sql = db();
  const rows = await sql<{ id: string; username: string; password_hash: string }[]>`
    SELECT id, username, password_hash FROM admin_users WHERE username = ${username}`;
  const user = rows[0];
  if (!user || !verifyPassword(password, user.password_hash)) return null;
  return { id: user.id, username: user.username };
}

export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString('hex');
  const sql = db();
  await sql`DELETE FROM sessions WHERE expires_at < now()`;
  await sql`
    INSERT INTO sessions (token, user_id, expires_at) VALUES (${token}, ${userId}, now() + ${`${MAX_AGE_S} seconds`}::interval)`;
  return token;
}

export async function destroySession(token: string): Promise<void> {
  const sql = db();
  await sql`DELETE FROM sessions WHERE token = ${token}`;
}

export async function currentUser(): Promise<AdminUser | null> {
  if (!HAS_DB) return null;
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const sql = db();
    const rows = await sql<{ id: string; username: string }[]>`
      SELECT u.id, u.username FROM sessions s
      JOIN admin_users u ON u.id = s.user_id
      WHERE s.token = ${token} AND s.expires_at > now()`;
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE_S,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}
