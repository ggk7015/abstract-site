import postgres from 'postgres';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export type Db = ReturnType<typeof postgres>;

/**
 * 資訊安全需求：此變數內含帳密，屬最高機敏。
 * 不可 import 到 client component、不可寫入任何 HTTP 回應或日誌。
 * 對外輸出錯誤一律使用 `redact()` / `safeError()` / `apiError()`（見 SECURITY.md）。
 */
export const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL || '';
export const HAS_DB = DATABASE_URL.length > 0;

let client: Db | null = null;

export function db(): Db {
  if (!client) {
    if (!DATABASE_URL) throw new Error('DATABASE_URL / POSTGRES_URL is not set');
    client = postgres(DATABASE_URL, {
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false,
      ssl: 'require',
    });
  }
  return client;
}

export function schemaSql(): string {
  return readFileSync(join(process.cwd(), 'src', 'lib', 'schema.sql'), 'utf8');
}
