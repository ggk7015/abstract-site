import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * 從 `.env.local` 載入環境變數。
 *
 * 為什麼需要：`tsx` 不像 `next` 一樣自動讀取 `.env.local`，所以
 * `npm run db:push` / `db:set-password` 會在明明有設定檔的情況下
 * 報 "Set DATABASE_URL first"。這裡補上 Next.js 的行為。
 *
 * 資訊安全需求：
 *   - **絕不覆寫**已存在的變數（shell 中明確匯出的值優先），
 *     避免意外用檔案內的舊值蓋掉操作者當場指定的密碼。
 *   - 跳過空值與 `#` 註解，支援 `KEY=value` 與 `export KEY=value`。
 *   - 檔案本身永遠不輸出到 console。
 */
export function loadLocalEnv(file = '.env.local'): void {
  const path = join(process.cwd(), file);
  if (!existsSync(path)) return;

  for (const rawLine of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 1) continue;

    const key = line.slice(0, eq).trim().replace(/^export\s+/, '');
    if (!key || key in process.env) continue;

    let value = line.slice(eq + 1).trim();
    const quote = value[0];
    if ((quote === '"' || quote === "'") && value.endsWith(quote) && value.length > 1) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}
