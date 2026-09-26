import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import postgres from 'postgres';

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!url) {
  console.error('Set DATABASE_URL (or POSTGRES_URL) first.');
  process.exit(1);
}

const sql = postgres(url, { ssl: 'require', max: 1, prepare: false });
const schema = readFileSync(join(process.cwd(), 'src', 'lib', 'schema.sql'), 'utf8');

try {
  await sql.unsafe(schema);
  const [{ count }] = await sql<{ count: number }[]>`
    SELECT count(*)::int AS count FROM information_schema.tables WHERE table_schema = 'public'`;
  console.log(`Schema applied. ${count} tables in public schema.`);
} catch (err) {
  console.error('Failed:', err instanceof Error ? err.message : err);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
