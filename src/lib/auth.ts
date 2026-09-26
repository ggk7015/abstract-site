import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { db, HAS_DB } from './db';
import { MIN_PASSWORD_LENGTH } from './session-policy';

export { MIN_PASSWORD_LENGTH };

const COOKIE = 'abs_session';
const MAX_AGE_S = 60 * 60 * 24 * 14;

export type AdminUser = { id: string; username: string };

/**
 * 資訊安全需求：密碼僅以 scrypt + 隨機 salt 單向雜湊儲存。
 * 禁止明文儲存、禁止可逆加密、禁止記錄到日誌。
 */
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

/**
 * 首次登入時建立管理員。
 *
 * 資訊安全需求：此函式「僅在帳號不存在時」寫入，刻意不在每次登入覆寫
 * `password_hash`，以免意外蓋掉管理員自行變更的密碼。
 *
 * 因此**只修改 ADMIN_PASSWORD 環境變數並不會輪替既有密碼**。
 * 輪替密碼請明確執行 `npm run db:set-password`。
 */
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

/** session token 前綴長度；作為 UI 端可見的 session 識別碼。 */
const FINGERPRINT_LEN = 12;

export type SessionInfo = {
  id: string;
  current: boolean;
  createdAt: string;
  expiresAt: string;
};

/**
 * 列出該帳號所有有效 session。
 *
 * 資訊安全需求：**絕不回傳完整 session token**。token 是 64 個 hex 字元的
 * 完整權限憑證，只輸出前 12 個字元作為識別碼（48 bits 熵，無法單獨用於
 * 認證），撤銷時以 `left(token, 12) = $id` 比對。
 */
export async function listSessions(userId: string): Promise<SessionInfo[]> {
  const store = await cookies();
  const current = store.get(COOKIE)?.value ?? '';
  const rows = await db()<{ token: string; created_at: Date; expires_at: Date }[]>`
    SELECT token, created_at, expires_at FROM sessions
    WHERE user_id = ${userId} AND expires_at > now()
    ORDER BY created_at DESC`;
  return rows.map((r) => ({
    id: r.token.slice(0, FINGERPRINT_LEN),
    current: r.token === current,
    createdAt: r.created_at.toISOString(),
    expiresAt: r.expires_at.toISOString(),
  }));
}

/**
 * 撤銷單一 session（以 token 前綴比對）。
 *
 * 資訊安全需求：`user_id` 條件不可省略 —— 否則任一已登入者都能猜測
 * 其他帳號的 token 前綴來撤銷別人的 session（跨使用者授權繞過）。
 * `id` 另須符合 12 位 hex 格式，避免任意字串進入比對。
 */
export async function revokeSession(userId: string, id: string): Promise<boolean> {
  if (!/^[0-9a-f]{12}$/.test(id)) return false;
  const rows = await db()<{ token: string }[]>`
    DELETE FROM sessions
    WHERE user_id = ${userId} AND left(token, ${FINGERPRINT_LEN}) = ${id}
    RETURNING token`;
  return rows.length > 0;
}

/**
 * 撤銷「其他」所有 session，保留目前這個。
 * 回傳撤銷筆數 —— 通常代表某個裝置的憑證已被驅逐。
 */
export async function revokeOtherSessions(userId: string): Promise<number> {
  const store = await cookies();
  const current = store.get(COOKIE)?.value;
  if (!current) return 0;
  const rows = await db()<{ token: string }[]>`
    DELETE FROM sessions WHERE user_id = ${userId} AND token <> ${current} RETURNING token`;
  return rows.length;
}


/**
 * 變更管理員密碼。
 *
 * 資訊安全需求：必須先驗證目前密碼；新密碼以 scrypt + 隨機 salt 雜湊；
 * 成功後撤銷所有 session（含目前），強制所有裝置重新登入。
 */
export async function changePassword(
  userId: string,
  currentPassword: string,
  nextPassword: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (nextPassword.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, error: `新密碼至少需要 ${MIN_PASSWORD_LENGTH} 個字元` };
  }
  const sql = db();
  const rows = await sql<{ password_hash: string }[]>`
    SELECT password_hash FROM admin_users WHERE id = ${userId}`;
  if (!rows[0] || !verifyPassword(currentPassword, rows[0].password_hash)) {
    return { ok: false, error: '目前密碼不正確' };
  }
  // 交易：改密碼與撤銷 session 必須同成同敗。若非交易，中途失敗會留下
  // 「密碼已改但舊 session 仍有效」的危險狀態。
  await sql.begin(async (tx) => {
    await tx`UPDATE admin_users SET password_hash = ${hashPassword(nextPassword)} WHERE id = ${userId}`;
    await tx`DELETE FROM sessions WHERE user_id = ${userId}`;
  });
  return { ok: true };
}
