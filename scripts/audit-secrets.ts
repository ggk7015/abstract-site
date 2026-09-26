/**
 * 資訊安全需求：資安把關 — 掃描 Git 追蹤的檔案，確認沒有任何 secret 被誤 commit。
 *
 *   npm run audit:secrets
 *
 * 檢查項目：
 *   1. 被追蹤的檔案內容含已知憑證格式
 *   2. .env / .env.local 等實際憑證檔被 Git 追蹤
 *   3. 常見環境變數被硬編碼在原始碼
 */

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

/** 實際憑證檔（.env.example / .env.sample 是範本，允許追蹤） */
const SECRET_FILES = [/^\.env(\.local|\.[^.]+)?$/, /^vercel\.env\.local$/];
const TEMPLATE_FILES = [/\.env\.example$/, /\.env\.sample$/, /\.env\.template$/];

const RULES: { name: string; re: RegExp }[] = [
  // Discord bot token = base64(snowflake).hmac.base64 → 第一段可能是 base64 字元，非純數字
  {
    name: 'Discord bot token',
    re: /\b[A-Za-z0-9_-]{15,30}\.[A-Za-z0-9_-]{5,10}\.[A-Za-z0-9_-]{25,}\b/,
  },
  { name: 'Postgres 連線字串（含密碼）', re: /\b[a-z][a-z0-9+.-]*:\/\/[^\s:@/]+:[^\s@/]+@/i },
  { name: 'VERCEL_TOKEN', re: /\bvca_[A-Za-z0-9]{16,}/ },
  { name: 'GitHub token', re: /\bgh[pousr]_[A-Za-z0-9]{20,}/ },
  { name: 'OpenAI key', re: /\bsk-[A-Za-z0-9_-]{20,}/ },
  { name: 'Google API key', re: /\bAIza[0-9A-Za-z_-]{30,}/ },
  { name: 'AWS access key', re: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: 'Supabase / Neon / Neon-style key', re: /\b(np_|sbp_|eyJ)[A-Za-z0-9_.-]{20,}/ },
  { name: '硬編碼 SECRET/TOKEN/PASSWORD 賦值', re: /\b[A-Z_]*(SECRET|TOKEN|PASSWORD|API_?KEY)\b\s*[:=]\s*['"][^'"]{8,}['"]/ },
];

const SCAN_EXT = /\.(ts|tsx|js|mjs|json|yml|yaml|toml|env|md|sql|css)$/i;
const SKIP = [/node_modules/, /package-lock\.json$/, /^\.next\//, /^\.vercel\//];

/**
 * 資訊安全需求：以下檔案「按設計」必須出現憑證格式字面��，因此跳過內容掃描。
 * 這些檔案本身不得存放任何真實憑證，改動時必須人工複核。
 */
const PATTERN_ALLOWLIST = [
  /^SECURITY\.md$/, // 規範文件中的說明性範例
  /^README\.md$/,
  /^src\/lib\/redact\.ts$/, // 遮罩規則本身的 regex 來源
  /^scripts\/audit-secrets\.ts$/, // 掃描器本身的規則定義
  /^scripts\/test-redact\.ts$/, // fixture 於執行時組裝，原始碼無憑證字面值
];

function git(args: readonly string[]): string {
  return execFileSync('git', args as string[], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
}

function main() {
  const tracked = git(['ls-files']).split('\n').filter(Boolean);
  const findings: string[] = [];

  for (const file of tracked) {
    if (SKIP.some((re) => re.test(file))) continue;
    if (TEMPLATE_FILES.some((re) => re.test(file))) continue;
    if (PATTERN_ALLOWLIST.some((re) => re.test(file))) continue;

    if (SECRET_FILES.some((re) => re.test(file))) {
      findings.push(`${file}  ← 憑證檔被 Git 追蹤`);
      continue;
    }

    if (!SCAN_EXT.test(file)) continue;

    let text: string;
    try {
      text = readFileSync(file, 'utf8');
    } catch {
      continue;
    }

    for (const { name, re } of RULES) {
      if (re.test(text)) findings.push(`${file}  ← ${name}`);
    }
  }

  if (findings.length) {
    console.error('\n✗ 資安把關未通過：偵測到疑似 secret\n');
    for (const f of findings) console.error(`  ${f}`);
    console.error('\n請改用環境變數，並輪替已外洩的憑證。\n');
    process.exit(1);
  }

  console.log(`✓ 資安把關通過：${tracked.length} 個追蹤檔案，未發現 secret。`);
}

main();
