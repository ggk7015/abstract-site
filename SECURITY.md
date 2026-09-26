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

### 5.1 輪替後台管理員密碼

修改 `ADMIN_PASSWORD` 環境變數**不會**改變資料庫中的既有密碼。
`ensureSeedAdmin()` 只在帳號不存在時寫入 `admin_users`，因此輪替必須明確執行：

```bash
npm run db:set-password   # 需 DATABASE_URL 與 ADMIN_PASSWORD
```

此腳本會重新產生 scrypt hash、覆寫該帳號，並 `DELETE FROM sessions WHERE user_id = ...`
使所有既有 cookie 立即失效。

**此腳本只會 `UPDATE`，不會建立新帳號。** 若 `ADMIN_USERNAME` 不存在就直接失敗並中止，
以免使用者名稱打錯時憑空多出一個預期外的管理員帳號。新增帳號是 `ensureSeedAdmin()`
的職責。若值剛好是 `[SENSITIVE]` 佔位符，腳本會拒絕執行（見 §5.2）。

也可以直接在後台「帳號安全」頁變更密碼：需輸入目前密碼，新密碼至少 12 字元，
成功後**所有** session（含目前裝置）都會被撤銷，必須重新登入。
此路徑會以單一交易（`sql.begin`）同時更新 hash 與刪除 session，
不會留下「密碼已改但舊 session 仍有效」的狀態。

⚠️ 後台變更密碼**不會**同步更新 Vercel 的 `ADMIN_PASSWORD`。若日後資料庫重建，
`ensureSeedAdmin()` 會以環境變數的值重新播種，與後台目前密碼可能不一致。
重建資料庫後請重新執行 `npm run db:set-password`（§5.1）。

### 5.2 `vercel env pull` 的已知陷阱

對以 `--sensitive` 儲存的變數（`ADMIN_PASSWORD`、`ADMIN_USERNAME`、`DISCORD_BOT_TOKEN`、
`INGEST_SECRET`、`CRON_SECRET`），`vercel env pull` **不會**回傳真實值，而是寫入
11 字元的佔位符 `[SENSITIVE]`。

後果：

- 不能用 `env pull` 的結果做自動化登入測試（會拿到佔位符而非真實密碼）
- 不能用 `env pull` 驗證 secret 是否已正確設定
- 自動化腳本若把佔位符當成密碼，會寫入無效的資料庫 hash
- 把佔位符當成 `ADMIN_USERNAME` 會建立一個名為 `[SENSITIVE]` 的多餘管理員帳號
  （2026-09-26 實際發生，`db:set-password` 已加防護並清理該帳號）

正確做法：secret 一律透過 Vercel Dashboard 或 `vercel env add --value` 設定，
自動化測試所需的變數應在同一次執行中「產生 → 設定 → 套用 → 驗證」，
不要依賴 `env pull` 回讀 sensitive 值。

補充：`npm run db:push` / `db:set-password` 透過 `scripts/load-env.ts` 自動載入
`.env.local`（`tsx` 本身不會），但**已存在於 shell 的變數優先**，不會被檔案覆寫。

### 5.3 Session 撤銷

- `DELETE /api/admin/sessions { id }` 以 token 前 12 個 hex 字元比對，
  查詢**必須**帶 `user_id` 條件，否則任一登入者都能撤銷他人 session。
- 完整 session token 永不出現在任何 HTTP 回應或日誌中。
- 密碼變更會撤銷該帳號**所有** session，強制所有裝置重新登入。

## 6. 目前部署的 secret 狀態

| Secret | 狀態 |
| --- | --- |
| `DISCORD_BOT_TOKEN` | ⚠️ **需輪替** — 2026-09-26 曾於對話中以明文出現 |
| `ADMIN_PASSWORD` | ✅ 已輪替（2026-09-26），舊值已失效 |
| `CRON_SECRET` | 未外洩 |
| `INGEST_SECRET` | 未外洩 |
| `DATABASE_URL` | ✅ Neon（Vercel 整合自動注入，pooled） |
| 本機 `.admin-credentials` | ⚠️ gitignored，僅限本機；共用機器上應刪除 |

## 事件紀錄

| 日期 | 事件 | 處理 |
| --- | --- | --- |
| 2026-09-26 | Discord bot token 與管理員密碼於對話中以明文提供 | 已加入 `redact()` 遮罩層與 `audit:secrets` 掃描；待輪替 |
| 2026-09-26 | 掃描器規則漏判 Discord token（`\d{17,20}` 假設第一段為數字） | 改為 `[\w-]{24,}` 類 Base64 比對，並加入植入測試 |
| 2026-09-26 | `db-push` / `db:set-password` 會印出含連線字串的 driver 錯誤 | 改用 `safeError()` 遮罩 |
| 2026-09-26 | 修改 `ADMIN_PASSWORD` 環境變數無法輪替既有後台密碼 | 新增 `scripts/set-admin-password.ts` 與 `npm run db:set-password` |
| 2026-09-26 | 誤以為 `vercel env pull` 的 `[SENSITIVE]` 佔位符是真實密碼，導致登入驗證失敗 | 記錄於 §5.2，自動化流程改為同次執行內完成產生與套用 |
| 2026-09-26 | `db:set-password` 的 `INSERT ... ON CONFLICT` 在使用者名稱不存在時會靜默建立新管理員帳號 | 改為只 `UPDATE`，不存在即失敗；並拒絕 `[SENSITIVE]` 佔位符（§5.1）。已清理誤建的 `[SENSITIVE]` 帳號 |
| 2026-09-26 | `tsx` 不會載入 `.env.local`，導致 `db:push` / `db:set-password` 誤報「Set DATABASE_URL first」 | 新增 `scripts/load-env.ts`（不覆寫既有環境變數） |
| 2026-09-26 | `revokeSession()` 缺少 `user_id` 條件，可撤銷其他帳號的 session（跨使用者授權繞過） | 補上 `user_id` 條件與 12 位 hex 格式驗證（§5.3） |
| 2026-09-26 | `changePassword()` 非交易式，中途失敗會留下「密碼已改但舊 session 仍有效」 | 改用 `sql.begin()` 將 hash 更新與 session 撤銷包成單一交易 |

