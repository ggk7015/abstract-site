/**
 * 設定／輪替後台管理員密碼。
 *
 *   npm run db:set-password
 *
 * 讀取環境變數 ADMIN_USERNAME（預設 admin）與 ADMIN_PASSWORD，
 * 以 scrypt 重新雜湊後寫入資料庫。
 *
 * 為什麼需要這個腳本：
 * `ensureSeedAdmin()` 只在帳號不存在時建立使用者（避免意外覆蓋資料庫中
 * 已經改過的密碼），因此**只改環境變數並不會輪替既有密碼**。
 * 輪替密碼必須明確執行此腳本。
 *
 * 資訊安全需求：密碼僅以 scrypt + 隨機 salt 儲存；本腳本不輸出密碼本身。
 */
import postgres from 'postgres';
import { randomBytes, scryptSync } from 'node:crypto';
import { safeError } from '../src/lib/redact';

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const username = process.env.ADMIN_USERNAME || 'admin';
const password = process.env.ADMIN_PASSWORD;

if (!url) {
  console.error('Set DATABASE_URL (or POSTGRES_URL) first.');
  process.exit(1);
}
if (!password) {
  console.error('Set ADMIN_PASSWORD first.');
  process.exit(1);
}
if (password.length < 12) {
  console.error('ADMIN_PASSWORD too short (minimum 12 characters).');
  process.exit(1);
}

const salt = randomBytes(16).toString('hex');
const hash = `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;

const sql = postgres(url, { ssl: 'require', max: 1, prepare: false });

try {
  const rows = await sql<{ id: string }[]>`
    INSERT INTO admin_users (username, password_hash)
    VALUES (${username}, ${hash})
    ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash
    RETURNING id`;
  // 清除既有 session，確保舊 cookie 立即失效
  await sql`DELETE FROM sessions WHERE user_id = ${rows[0].id}`;
  console.log(`Password updated for "${username}". Existing sessions revoked.`);
} catch (err) {
  console.error('Failed:', safeError(err));
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
