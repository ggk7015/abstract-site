# 抽象 — 公開官網 + 後台

Minecraft 伺服器「抽象」的公開網站，含完整後台（公告、網站設定、Discord 訊息鏡像、Meta 風格洞察報告）。
部署於 Vercel，非本機託管。

## 技術

- Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4
- Postgres（Vercel Postgres / Neon）via `postgres` (porsager)
- 圖表全部手寫 SVG，零圖表依賴
- Admin 認證：scrypt 密碼雜湊 + httpOnly session cookie

## 指令

```bash
npm install
npm run dev          # 本機開發
npm run typecheck    # tsc --noEmit
npm run build        # 正式建置
npm run db:push      # 套用 schema（需 DATABASE_URL）
```

## 環境變數

複製 `.env.example` 為 `.env.local`，最少需要：

| 變數 | 說明 |
| --- | --- |
| `DATABASE_URL` | Postgres 連線字串 |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | 後台帳號，首次登入時自動建立 |
| `NEXT_PUBLIC_DISCORD_INVITE` | Discord 邀請連結 |

選填：`DISCORD_BOT_TOKEN`、`DISCORD_CHANNEL_ID`（Discord 訊息鏡像）、`INGEST_SECRET`（外部推送訊息到 `/api/ingest/discord`）。

## 路由

### 公開
| 路徑 | 說明 |
| --- | --- |
| `/` | 首頁（連線資訊、即時狀態、玩法、公告預覽） |
| `/server` | 伺服器詳細規格與加入步驟 |
| `/features` | 完整玩法列表 |
| `/announcements`、`/announcements/[slug]` | 公告列表與內頁 |
| `/community` | Discord 社群 + 遊戲內聊天鏡像 |

### 後台（`/admin`，需登入）
| 路徑 | 說明 |
| --- | --- |
| `/admin` | 洞察總覽：PV/UV、趨勢、來源、裝置、活躍時段熱圖 |
| `/admin/announcements` | 公告 CRUD |
| `/admin/settings` | 伺服器資訊、玩法、連結、文案 |
| `/admin/discord` | Discord 訊息鏡像與手動同步 |

### API
| 方法 | 路徑 | 說明 |
| --- | --- | --- |
| `POST` | `/api/track` | 頁面瀏覽事件（sendBeacon） |
| `GET` | `/api/live` | MC 伺服器狀態 + Discord 成員數 |
| `GET` | `/api/community/messages` | 已鏡像的 Discord 訊息 |
| `POST` | `/api/ingest/discord` | 外部推入 Discord 訊息（需 `x-ingest-secret`） |
| `POST` | `/api/admin/login` / `logout` | 後台認證 |
| `GET/POST/PATCH/DELETE` | `/api/admin/announcements[/:id]` | 公告 API |
| `GET/PUT` | `/api/admin/settings` | 設定 API |
| `GET/POST` | `/api/admin/discord` | 讀取 / 同步 Discord 訊息 |
| `GET` | `/api/admin/insights?days=7\|30\|90` | 洞察報告資料 |

## 已知限制

`abstract.pmcs.life:25565` 接受 TCP 連線但不回應 Server List Ping（推測前端有防掃描代理），
因此首頁的「即時玩家數」在網路環境不同時可能顯示「無法連線」。協定實作本身正確
（`src/lib/mcstatus.ts`），若伺服器端開放 status ping 就會正常顯示。
