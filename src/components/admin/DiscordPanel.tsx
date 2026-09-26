'use client';

import { useState } from 'react';
import type { DiscordMessage } from '@/lib/discord';
import { ConfirmButton, DangerZone } from './ConfirmButton';

export function DiscordPanel({
  initial,
  botConfigured,
}: {
  initial: DiscordMessage[];
  botConfigured: boolean;
}) {
  const [messages, setMessages] = useState(initial);
  const [message, setMessage] = useState('');

  const reload = async () => {
    const list = await fetch('/api/admin/discord', { cache: 'no-store' }).then((r) => r.json());
    setMessages(list.messages ?? []);
  };

  const sync = async () => {
    setMessage('同步中…');
    const res = await fetch('/api/admin/discord', { method: 'POST' });
    const json = await res.json();
    if (!res.ok) {
      setMessage(json.error ?? '同步失敗');
      return;
    }
    setMessage(`已抓取 ${json.fetched} 則，新增 ${json.inserted} 則`);
    await reload();
  };

  const drop = async (id: string) => {
    const res = await fetch('/api/admin/discord', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) {
      setMessage(((await res.json()) as { error?: string }).error ?? '刪除失敗');
      return;
    }
    setMessages((prev) => prev.filter((m) => m.id !== id));
    setMessage('已撤銷該則鏡像訊息');
  };

  const clearAll = async () => {
    const res = await fetch('/api/admin/discord', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (!res.ok) {
      setMessage(((await res.json()) as { error?: string }).error ?? '清除失敗');
      return;
    }
    const { removed } = (await res.json()) as { removed: number };
    setMessages([]);
    setMessage(`已清除 ${removed} 則鏡像訊息`);
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

        <div className="mt-5 flex flex-wrap items-center gap-4">
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
              <li key={m.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-baseline gap-2">
                    <span className="text-sm text-bone">{m.authorName}</span>
                    <span className="font-mono text-[0.625rem] text-ash-2">
                      {new Date(m.createdAt).toLocaleString('zh-TW', { hour12: false })}
                    </span>
                  </p>
                  <p className="mt-1 break-words text-sm text-ash">{m.content}</p>
                </div>
                <ConfirmButton
                  label="撤銷"
                  subject="這則鏡像訊息"
                  onConfirm={() => drop(m.id)}
                  className="shrink-0"
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <DangerZone
        title="撤銷鏡像資料"
        description="清除後這些訊息會從本站資料庫移除。Discord 伺服器上的原始訊息不受影響；再次同步會重新抓回仍在頻道中的訊息。"
      >
        <ConfirmButton
          label="清除全部鏡像"
          subject="資料庫中所有鏡像訊息"
          confirmWord="清除全部"
          onConfirm={clearAll}
          disabled={messages.length === 0}
        />
      </DangerZone>
    </div>
  );
}
