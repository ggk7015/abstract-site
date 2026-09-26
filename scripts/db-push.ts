import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import postgres from 'postgres';
import { safeError } from '../src/lib/redact';
import { loadLocalEnv } from './load-env';

loadLocalEnv();

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!url) {
  console.error('Set DATABASE_URL (or POSTGRES_URL) first.');
  process.exit(1);
}

// 資訊安全需求：driver 錯誤可能含完整連線字串，一律經 safeError() 遮罩。
const sql = postgres(url, { ssl: 'require', max: 1, prepare: false });
const schema = readFileSync(join(process.cwd(), 'src', 'lib', 'schema.sql'), 'utf8');

try {
  await sql.unsafe(schema);
  const [{ count }] = await sql<{ count: number }[]>`
    SELECT count(*)::int AS count FROM information_schema.tables WHERE table_schema = 'public'`;
  console.log(`Schema applied. ${count} tables in public schema.`);
} catch (err) {
  console.error('Failed:', safeError(err));
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
