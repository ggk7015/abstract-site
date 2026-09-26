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
import { loadLocalEnv } from './load-env';

loadLocalEnv();

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

/**
 * 資訊安全需求：`vercel env pull` 對 sensitive 變數只會給出 `[SENSITIVE]`
 * 佔位符。若把它當密碼雜湊，帳號就會被鎖死（沒有人知道真正的值）；
 * 若把它當使用者名稱，則會憑空多出一個非預期的管理員帳號。
 */
const PLACEHOLDER = '[SENSITIVE]';
for (const [name, value] of Object.entries({ ADMIN_USERNAME: username, ADMIN_PASSWORD: password })) {
  if (value === PLACEHOLDER) {
    console.error(`${name} is the "${PLACEHOLDER}" placeholder from \`vercel env pull\`, not a real value.`);
    console.error(`Set ${name} explicitly in the shell before running this script.`);
    process.exit(1);
  }
}

const salt = randomBytes(16).toString('hex');
const hash = `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;

const sql = postgres(url, { ssl: 'require', max: 1, prepare: false });

try {
  // 只做 UPDATE，**不** INSERT：輪替工具若在使用者名稱打錯時自動開新帳號，
  // 會產生一個預期外的管理員帳號（真正的舊帳號密碼也沒換到）。
  // 新增帳號是 `ensureSeedAdmin()` 的職責，見 SECURITY.md。
  const rows = await sql<{ id: string }[]>`
    UPDATE admin_users SET password_hash = ${hash} WHERE username = ${username} RETURNING id`;

  if (rows.length === 0) {
    console.error(`No admin user named "${username}". Create it first via ensureSeedAdmin(),`);
    console.error('or pass the correct name: $env:ADMIN_USERNAME = "<existing user>".');
    process.exitCode = 1;
  } else {
    // 清除既有 session，確保舊 cookie 立即失效
    await sql`DELETE FROM sessions WHERE user_id = ${rows[0].id}`;
    console.log(`Password updated for "${username}". Existing sessions revoked.`);
  }
} catch (err) {
  console.error('Failed:', safeError(err));
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
