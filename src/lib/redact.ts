/**
 * 資訊安全需求 / Information security requirement
 * -------------------------------------------------
 * 任何 secret（token、密碼、資料庫連線字串）都不得以明文出現在：
 *   - HTTP 回應 body
 *   - 伺服器日誌 / console
 *   - 例外訊息
 *   - Git 追蹤的檔案
 *
 * 所有對外輸出錯誤訊息一律經過 `safeError()` / `redact()`。
 */

const PLACEHOLDER = '[REDACTED]';

/** 從 process.env 取出所有值為「機密」的變數，逐一建置遮罩規則。 */
function secretValues(): string[] {
  const names = [
    'DATABASE_URL',
    'POSTGRES_URL',
    'POSTGRES_PRISMA_URL',
    'ADMIN_PASSWORD',
    'DISCORD_BOT_TOKEN',
    'INGEST_SECRET',
    'CRON_SECRET',
    'VERCEL_TOKEN',
    'GITHUB_TOKEN',
  ];
  return names
    .map((n) => process.env[n])
    .filter((v): v is string => typeof v === 'string' && v.length >= 8)
    .flatMap((v) => [v, encodeURIComponent(v), v.replace(/[^A-Za-z0-9._-]/g, '')].filter((x) => x.length >= 8));
}

type Replacer = (...args: string[]) => string;
type Rule = { re: RegExp; to: Replacer };

const PATTERNS: Rule[] = [
  // postgres://user:password@host  →  保留協定與主機，遮罩帳密
  {
    re: /\b([a-z][a-z0-9+.-]*):\/\/[^\s:@/]+:[^\s@/]+@/gi,
    to: (_m, scheme) => `${scheme}://${PLACEHOLDER}:${PLACEHOLDER}@`,
  },
  // Discord bot token: base64(snowflake).hmac-hash.base64（第一段可能是 base64 字元）
  { re: /\b[A-Za-z0-9_-]{15,30}\.[A-Za-z0-9_-]{5,10}\.[A-Za-z0-9_-]{25,}\b/g, to: () => PLACEHOLDER },
  // Bearer / Bot / token 形式的權杖
  {
    re: /\b(Bearer|Bot|token|api[_-]?key|secret)\b(\s*[:=]?\s*)\S{16,}/gi,
    to: (_m, label, gap) => `${label}${gap}${PLACEHOLDER}`,
  },
  // query string 中的 key
  {
    re: /([?&](?:key|token|secret|access_token|api_key)=)[^&\s]+/gi,
    to: (_m, prefix) => `${prefix}${PLACEHOLDER}`,
  },
  // cookie
  { re: /\b(abs_session=)[^;\s]+/gi, to: (_m, prefix) => `${prefix}${PLACEHOLDER}` },
  // 任何長度 ≥ 20 且含 percent-encoded 連線資訊的片段 → 整段遮罩
  // （driver 錯誤訊息可能回傳 encodeURIComponent 後的 DATABASE_URL）
  {
    re: /[^\s"'<>]{20,}/g,
    to: (m) => (/%40|%3A%2F%2F|%3a%2f%2f/i.test(m) ? PLACEHOLDER : m),
  },
];

/** 把任何字串中的已知 secret 與已知格式的憑證替換成 [REDACTED]。 */
export function redact(input: string): string {
  let out = input;
  for (const secret of secretValues()) {
    out = out.split(secret).join(PLACEHOLDER);
  }
  for (const { re, to } of PATTERNS) {
    out = out.replace(re, to);
  }
  return out;
}

/** 對外用的錯誤訊息：已遮罩、長度受限、不含堆疊。 */
export function safeError(err: unknown, max = 200): string {
  const raw = err instanceof Error ? err.message : String(err ?? 'unknown error');
  const firstLine = raw.split('\n')[0] ?? raw;
  return redact(firstLine).slice(0, max);
}

/** 只顯示「有沒有設定」，絕不顯示值或長度。 */
export function configStatus(name: string, isSet: boolean): string {
  return `${name}=${isSet ? 'configured' : 'not-configured'}`;
}
