'use client';

import { useEffect, useState } from 'react';
import { CopyIp } from './CopyIp';

type Live = {
  server: { online: boolean; playersOnline?: number; playersMax?: number; version?: string; latencyMs?: number; error?: string };
  discord: { name: string; members: number; online: number; error?: string };
};

const FALLBACK: Live = {
  server: { online: false, error: '尚未取得' },
  discord: { name: '抽象', members: 0, online: 0 },
};

export function LiveStats() {
  const [data, setData] = useState<Live>(FALLBACK);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch('/api/live', { cache: 'no-store' });
        const json = await res.json();
        if (alive) setData(json);
      } catch {
        /* keep previous value */
      } finally {
        if (alive) setLoading(false);
      }
    };
    void load();
    const timer = setInterval(load, 60_000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  const s = data.server;
  const d = data.discord;
  const online = s.online && !s.error;

  return (
    <div className="grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
      <Cell label="伺服器狀態" loading={loading}>
        <span className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${online ? 'bg-acid pulse-dot' : 'bg-ash'}`}
            aria-hidden
          />
          <span className={online ? 'text-acid' : 'text-ash'}>
            {loading ? '連線中…' : online ? '線上' : '雲端無法偵測'}
          </span>
        </span>
      </Cell>

      <Cell label="目前在線玩家" loading={loading}>
        {loading || !online ? '—' : `${s.playersOnline ?? 0} / ${s.playersMax ?? '?'}`}
      </Cell>

      <Cell label="Discord 社群" loading={loading}>
        {loading ? '—' : d.members > 0 ? `${d.members} 位成員` : '無法取得'}
      </Cell>

      <Cell label="伺服器 IP" loading={false}>
        <CopyIp value="abstract.pmcs.life" />
      </Cell>
    </div>
  );
}

function Cell({
  label,
  loading,
  children,
}: {
  label: string;
  loading: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-ink-2 px-4 py-3">
      <p className="label">{label}</p>
      <div className="mt-1 font-mono text-sm text-bone">{children}</div>
    </div>
  );
}
