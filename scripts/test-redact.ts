/**
 * 資安自我測試：驗證 redact() / safeError() 不會讓 secret 外洩。
 *   npm run test:redact
 *
 * 資訊安全需求：測試 fixture 一律在執行時組裝，
 * 原始碼中不得出現任何結構完整的憑證字面值
 * （否則 GitHub push protection / audit:secrets 會阻擋，且等於把憑證寫進版本庫）。
 */
import { redact, safeError } from '../src/lib/redact';

// 結構合法（base64.hmac.base64）但絕對不是真實憑據：執行時才組出
const TOKEN = ['A'.repeat(22), 'B'.repeat(6), `FAKE_TOKEN_UNIT_TEST_${'C'.repeat(20)}`].join('.');
const PG = `postgres://abstract:${'x'.repeat(12)}pass@db.example.com:5432/abstract`;

const CASES: { name: string; input: string; mustNotContain: string[] }[] = [
  { name: 'Discord token 裸露', input: `token=${TOKEN}`, mustNotContain: [TOKEN] },
  { name: 'Postgres 連線字串', input: `connect failed: ${PG}`, mustNotContain: ['xxxxxxxxxxxxpass'] },
  { name: 'Postgres URL 已編碼', input: `url=${encodeURIComponent(PG)}`, mustNotContain: ['xxxxxxxxxxxxpass'] },
  { name: 'query string secret', input: '/api/cron/discord?key=s3cr3tvalue123', mustNotContain: ['s3cr3tvalue123'] },
  { name: 'Bearer 權杖', input: 'authorization: Bearer abcdef0123456789abcdef', mustNotContain: ['abcdef0123456789abcdef'] },
  { name: 'session cookie', input: 'abs_session=0123456789abcdef0123456789abcdef', mustNotContain: ['0123456789abcdef0123456789abcdef'] },
  { name: '多行錯誤堆疊', input: `Error: boom\n  at ${PG}\n  token ${TOKEN}`, mustNotContain: ['xxxxxxxxxxxxpass', TOKEN] },
];

let failed = 0;
for (const c of CASES) {
  const out = redact(c.input);
  const leaked = c.mustNotContain.filter((s) => out.includes(s));
  if (leaked.length) {
    failed++;
    console.error(`FAIL ${c.name} 洩漏 ${leaked.length} 項: ${leaked.map((s) => s.slice(0, 12)).join(',')}`);
  } else {
    console.log(`PASS ${c.name}  ->  ${out.replace(/\s+/g, ' ').slice(0, 70)}`);
  }
}

const safe = safeError(new Error(`boom ${PG}\nstack`));
if (safe.includes('xxxxxxxxxxxxpass') || safe.includes('\n')) {
  failed++;
  console.error('FAIL safeError 未遮罩或未截斷多行');
} else {
  console.log(`PASS safeError 單行且已遮罩  ->  ${safe}`);
}

console.log(failed ? `\nFAIL ${failed} 項` : '\nALL PASS');
process.exit(failed ? 1 : 0);
