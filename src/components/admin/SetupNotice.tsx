export function SetupNotice() {
  return (
    <div className="panel p-6">
      <p className="label">需要設定</p>
      <h2 className="display mt-3 text-3xl">尚未連接資料庫</h2>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ash">
        公開頁面目前以預設內容正常運作，但後台需要 Postgres 才能儲存公告、設定與洞察資料。
      </p>

      <ol className="mt-6 space-y-3 text-sm text-ash">
        <li>
          <span className="mr-2 font-mono text-xs text-acid">01</span>
          開啟 Vercel 專案 → <span className="font-mono text-bone">Storage</span> → Create Database → Postgres
        </li>
        <li>
          <span className="mr-2 font-mono text-xs text-acid">02</span>
          到 <span className="font-mono text-bone">Settings → Environment Variables</span> 確認已自動建立
          <span className="font-mono text-bone"> POSTGRES_URL</span>（或自行加入 <span className="font-mono text-bone">DATABASE_URL</span>）
        </li>
        <li>
          <span className="mr-2 font-mono text-xs text-acid">03</span>
          設定 <span className="font-mono text-bone">ADMIN_USERNAME</span> 與{' '}
          <span className="font-mono text-bone">ADMIN_PASSWORD</span>
        </li>
        <li>
          <span className="mr-2 font-mono text-xs text-acid">04</span>
          重新部署（Redeploy），資料表會在首次登入時自動建立
        </li>
      </ol>
    </div>
  );
}
