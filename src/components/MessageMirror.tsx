'use client';

import { useEffect, useState } from 'react';

type Msg = {
  id: string;
  authorName: string | null;
  authorAvatar: string | null;
  content: string;
  createdAt: string;
};

export function MessageMirror() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'empty'>('loading');

  useEffect(() => {
    let alive = true;
    fetch('/api/community/messages?limit=30', { cache: 'no-store' })
      .then((r) => r.json())
      .then((json) => {
        if (!alive) return;
        const list: Msg[] = json.messages ?? [];
        setMessages(list);
        setState(list.length ? 'ready' : 'empty');
      })
      .catch(() => alive && setState('empty'));
    return () => {
      alive = false;
    };
  }, []);

  if (state === 'loading') {
    return <div className="h-40 animate-pulse bg-ink-2" aria-label="載入中" />;
  }

  if (state === 'empty') {
    return (
      <div className="border border-dashed border-line-2 p-8 text-center text-sm text-ash-2">
        尚未同步 Discord 訊息。後台設定好機器人後，這裡會顯示「聊天同步」頻道的即時內容。
      </div>
    );
  }

  return (
    <ul className="divide-y divide-line border-y border-line">
      {messages.map((m) => (
        <li key={m.id} className="flex gap-3 py-4">
          <div className="h-8 w-8 shrink-0 overflow-hidden border border-line bg-ink-3">
            {m.authorAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={m.authorAvatar} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="grid h-full w-full place-items-center font-mono text-[0.625rem] text-ash-2">
                {(m.authorName ?? '?').slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="flex items-baseline gap-2">
              <span className="text-sm text-bone">{m.authorName ?? '未知'}</span>
              <span className="font-mono text-[0.625rem] text-ash-2">
                {new Date(m.createdAt).toLocaleString('zh-TW', { hour12: false })}
              </span>
            </p>
            <p className="mt-1 break-words text-sm leading-relaxed text-ash">{m.content}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
