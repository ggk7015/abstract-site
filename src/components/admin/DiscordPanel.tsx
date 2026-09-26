'use client';

import { useState } from 'react';
import type { DiscordMessage } from '@/lib/discord';

export function DiscordPanel({
  initial,
  botConfigured,
}: {
  initial: DiscordMessage[];
  botConfigured: boolean;
}) {
  const [messages, setMessages] = useState(initial);
  const [message, setMessage] = useState('');

  const sync = async () => {
    setMessage('同步中…');
    const res = await fetch('/api/admin/discord', { method: 'POST' });
    const json = await res.json();
    if (!res.ok) {
      setMessage(json.error ?? '同步失敗');
      return;
    }
    setMessage(`已抓取 ${json.fetched} 則，新增 ${json.inserted} 則`);
    const list = await fetch('/api/admin/discord', { cache: 'no-store' }).then((r) => r.json());
    setMessages(list.messages ?? []);
  };

  return (
    <div className="space-y-6">
      <section className="panel p-5">
        <h2 className="text-sm text-bone">同步設定</h2>
        <dl className="mt-4 space-y-2 font-mono text-xs">
          <div className="flex justify-between border-b border-line pb-2">
            <dt className="text-ash-2">DISCORD_BOT_TOKEN</dt>
            <dd className={botConfigured ? 'text-acid' : 'text-blood'}>
              {botConfigured ? '已設定' : '未設定'}
            </dd>
          </div>
          <div className="flex justify-between border-b border-line pb-2">
            <dt className="text-ash-2">DISCORD_CHANNEL_ID</dt>
            <dd className="text-ash">聊天同步 頻道 ID</dd>
          </div>
        </dl>

        {!botConfigured && (
          <ol className="mt-5 space-y-2 text-xs leading-relaxed text-ash">
            <li>1. 到 https://discord.com/developers/applications 建立應用程式</li>
            <li>2. Bot → Reset Token，複製並設為 Vercel 環境變數 DISCORD_BOT_TOKEN</li>
            <li>3. 開啟 Message Content Intent，邀請機器人進你的 【抽象】 伺服器</li>
            <li>4. 在伺服器「聊天同步」頻道右鍵 → 複製頻道 ID，設為 DISCORD_CHANNEL_ID</li>
          </ol>
        )}

        <div className="mt-5 flex items-center gap-4">
          <button type="button" onClick={sync} disabled={!botConfigured} className="btn disabled:opacity-40">
            立即同步最近 50 則
          </button>
          {message && <span className="font-mono text-xs text-ash-2">{message}</span>}
        </div>
      </section>

      <section>
        <h2 className="text-sm text-bone">已鏡像訊息（{messages.length}）</h2>
        {messages.length === 0 ? (
          <p className="mt-4 border border-dashed border-line-2 p-6 text-center text-sm text-ash-2">
            尚無資料。設定好機器人後按「立即同步」。
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {messages.map((m) => (
              <li key={m.id} className="py-3">
                <p className="flex flex-wrap items-baseline gap-2">
                  <span className="text-sm text-bone">{m.authorName}</span>
                  <span className="font-mono text-[0.625rem] text-ash-2">
                    {new Date(m.createdAt).toLocaleString('zh-TW', { hour12: false })}
                  </span>
                </p>
                <p className="mt-1 break-words text-sm text-ash">{m.content}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
