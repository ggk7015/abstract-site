# 資訊安全需求（Information Security Requirements）

本文件為本專案的**強制規範**。任何貢獻者與自動化流程都必須遵守。

## 1. 核心原則

> **任何 secret 都不得以明文出現在對外可見的地方。**

「對外可見」包含：

| 位置 | 允許內容 |
| --- | --- |
| HTTP 回應 body / header | 僅遮罩後的錯誤碼或 `[REDACTED]` |
| 伺服器日誌 / `console.*` | 僅遮罩後內容；禁止輸出 env 值 |
| 例外訊息（Error message） | 經 `safeError()` 處理 |
| Git 追蹤的檔案 | 禁止；僅 `.env.example` 範本可追蹤 |
| 公開 issue / PR / commit message | 禁止貼上任何憑證 |
| 截圖、log 分享 | 需先遮罩 |

## 2. Secret 分類與保管

| 變數 | 分類 | 存放位置 | 可否公開 |
| --- | --- | --- | --- |
| `DATABASE_URL` / `POSTGRES_URL` | 高（內含帳密） | Vercel Secret | 否 |
| `ADMIN_PASSWORD` | 高 | Vercel Secret | 否 |
| `DISCORD_BOT_TOKEN` | 高（等同帳號權限） | Vercel Secret | 否 |
| `CRON_SECRET` / `INGEST_SECRET` | 中 | Vercel + GitHub Secret | 否 |
| `ADMIN_USERNAME` | 低 | Vercel Config | 可 |
| `NEXT_PUBLIC_*` | 公開 | Vercel Config | 可（僅限確實公開者） |

**規則**

1. `NEXT_PUBLIC_` 前綴代表**會被打包進瀏覽器程式碼**。只有真正公開的 值 能使用此前綴。
2. Discord bot token 等同機器人完整權限，取得後視同帳密外洩處理。
3. 不得在程式碼中使用 `NEXT_PUBLIC_` 傳遞任何機密。

## 3. 程式層強制措施

### 3.1 輸出前必須經過 `redact()`

```ts
import { redact, safeError } from '@/lib/redact';

redact('任意字串');            // 遮罩所有已知 secret 與憑證格式
safeError(unknownError);       // 遮罩 + 只取第一行 + 長度上限 200
```

`redact()` 會遮罩：

- `process.env` 中所有機密變數的值（含 URL-encoded 版本）
- 任何含帳密的連線字串 `scheme://user:pass@host`
- Discord bot token（`base64.hmac.base64`）
- `Bearer` / `Bot` / `token=` / `api_key=` 形式的權杖
- query string 中的 `key` / `token` / `secret`
- `abs_session` cookie
- 長度 ≥ 20 且含 percent-encoded 連線資訊的片段

### 3.2 API 錯誤回應

所有會回傳 driver / 第三方錯誤訊息的端點，一律使用 `apiError()`：

```ts
import { apiError } from '@/lib/guard';
return apiError(err, 502, 'discord sync failed');
```

**禁止**直接 `NextResponse.json({ error: err.message })` —— postgres driver 的錯誤
可能包含完整連線字串。

### 3.3 密碼處理

- 儲存：`scrypt`（`src/lib/auth.ts`），16 bytes 隨機 salt，禁止明文 / 可逆加密
- 比對：`timingSafeEqual`，避免時序攻擊
- 傳輸：HTTPS only；cookie 為 `httpOnly` + `sameSite=lax` + `secure`（production）

## 4. 建置與提交前檢查

```bash
npm run audit:secrets   # 掃描 Git 追蹤檔案是否含憑證
npm run verify          # typecheck + audit:secrets + build
```

`scripts/audit-secrets.ts` 偵測規則：

- Discord bot token、Vercel / GitHub / OpenAI / Google / AWS / Supabase / Neon key
- 含密碼的連線字串
- 硬編碼的 `SECRET` / `TOKEN` / `PASSWORD` / `API_KEY` 賦值
- `.env`、`.env.local` 等實際憑證檔被 Git 追蹤

`scripts/test-redact.ts` 驗證遮罩邏輯本身沒有漏網。

## 5. 外洩事件處理流程

若 secret 曾經以明文出現（commit、log、截圖、對話）：

1. **立即輪替**該憑證（Discord：Reset Token；Vercel：重新產生 token；DB：改密碼）
2. 更新 Vercel / GitHub Secrets
3. 重新部署
4. 若已進入 Git 歷史，視為已外洩 —— 輪替是唯一有效補救，`git filter-repo` 不能救回已複製的資料
5. 記錄於本文件末「事件紀錄」

## 6. 目前部署的 secret 狀態

| Secret | 狀態 |
| --- | --- |
| `DISCORD_BOT_TOKEN` | ⚠️ **需輪替** — 2026-09-26 曾於對話中以明文出現 |
| `ADMIN_PASSWORD` | ⚠️ **需輪替** — 同上 |
| `CRON_SECRET` | 未外洩 |
| `INGEST_SECRET` | 未外洩 |
| `DATABASE_URL` | 尚未建立 |

## 事件紀錄

| 日期 | 事件 | 處理 |
| --- | --- | --- |
| 2026-09-26 | Discord bot token 與管理員密碼於對話中以明文提供 | 已加入 `redact()` 遮罩層與 `audit:secrets` 掃描；待輪替 |
