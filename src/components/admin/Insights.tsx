'use client';

import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { StatCard } from './StatCard';
import { TrendChart, type Series } from './TrendChart';
import { BarList, type Row } from './BarList';
import { ActivityHeatmap, type HeatCell } from './ActivityHeatmap';
import { ConfirmButton, DangerZone } from './ConfirmButton';

type Overview = {
  totalPv: number; totalUv: number; todayPv: number; todayUv: number;
  yesterdayPv: number; yesterdayUv: number; pvDelta: number; uvDelta: number;
  liveNow: number; avgDurationMs: number;
};

type Discord = { total: number; today: number; authors: number; series: { day: string; count: number }[]; top: Row[] };

type Stored = { total: number; oldest: string | null; newest: string | null };

type Payload = {
  days: number;
  overview: Overview;
  series: Series[];
  pages: Row[];
  referrers: Row[];
  devices: Row[];
  browsers: Row[];
  heat: HeatCell[];
  discord: Discord;
  stored: Stored;
};

const RANGES = [7, 30, 90] as const;

export function Insights() {
  const params = useSearchParams();
  const days = Number(params.get('days') ?? 30);
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/insights?days=${days}`, { cache: 'no-store' });
    if (!res.ok) {
      setError(((await res.json()) as { error?: string }).error ?? '載入失敗');
      return;
    }
    setData((await res.json()) as Payload);
  }, [days]);

  useEffect(() => {
    void load();
  }, [load]);

  /** 撤銷追蹤資料；body 省略代表清空全部。 */
  const purge = async (body: Record<string, unknown>, label: string) => {
    setNotice('');
    const res = await fetch('/api/admin/insights', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      setNotice(((await res.json()) as { error?: string }).error ?? '撤銷失敗');
      return;
    }
    const { removed } = (await res.json()) as { removed: number };
    setNotice(`${label}：已移除 ${fmt(removed)} 筆`);
    await load();
  };

  if (error) return <p className="font-mono text-xs text-blood">{error}</p>;
  if (!data) return <p className="font-mono text-xs text-ash-2">載入中…</p>;

  const o = data.overview;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="label">洞察報告</p>
          <p className="mt-1 text-sm text-ash">仿 Meta / IG 後台的流量與受眾分析</p>
        </div>
        <div className="flex gap-1">
          {RANGES.map((d) => (
            <a
              key={d}
              href={`/admin?days=${d}`}
              className={`border px-3 py-1.5 font-mono text-xs transition-colors ${
                d === days ? 'border-acid bg-acid text-ink' : 'border-line text-ash hover:text-bone'
              }`}
            >
              {d} 天
            </a>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="今日瀏覽量" value={fmt(o.todayPv)} delta={o.pvDelta} hint={`昨日 ${fmt(o.yesterdayPv)}`} />
        <StatCard label="今日獨立訪客" value={fmt(o.todayUv)} delta={o.uvDelta} hint={`昨日 ${fmt(o.yesterdayUv)}`} />
        <StatCard label="累積瀏覽量" value={fmt(o.totalPv)} hint={`${fmt(o.totalUv)} 位獨立訪客`} />
        <StatCard label="目前在線" value={fmt(o.liveNow)} hint="最近 5 分鐘" />
      </div>

      <Panel title="流量趨勢" sub={`最近 ${data.days} 天`}>
        <TrendChart data={data.series} />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="熱門頁面" sub={`最近 ${data.days} 天`}>
          <BarList rows={data.pages} />
        </Panel>
        <Panel title="流量來源" sub={`最近 ${data.days} 天`}>
          <BarList rows={data.referrers} />
        </Panel>
        <Panel title="裝置分佈">
          <BarList rows={data.devices} />
        </Panel>
        <Panel title="瀏覽器分佈">
          <BarList rows={data.browsers} />
        </Panel>
      </div>

      <Panel title="受眾活躍時段" sub={`最近 ${data.days} 天 · 依台灣時區`}>
        <ActivityHeatmap cells={data.heat} />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Discord 訊息數">
          <div className="grid grid-cols-3 gap-4 text-center">
            <Metric label="今日" value={fmt(data.discord.today)} />
            <Metric label="累積" value={fmt(data.discord.total)} />
            <Metric label="發言者" value={fmt(data.discord.authors)} />
          </div>
        </Panel>
        <div className="lg:col-span-2">
          <Panel title="最常發言" sub="Discord 鏡像">
            <BarList rows={data.discord.top} unit="則" />
          </Panel>
        </div>
      </div>

      <p className="font-mono text-[0.625rem] text-ash-2">
        平均停留 {Math.round(o.avgDurationMs / 1000)} 秒 · 資料來源：站台自身 page_views 與 discord_messages
      </p>

      <DangerZone
        title="撤銷追蹤資料"
        description={`資料庫目前存有 ${fmt(data.stored.total)} 筆瀏覽紀錄${
          data.stored.oldest ? `，最早 ${new Date(data.stored.oldest).toLocaleDateString('zh-TW')}` : ''
        }。撤銷後無法復原，且洞察報告會立即歸零。`}
      >
        <ConfirmButton
          label="撤銷 90 天前資料"
          subject="90 天前的瀏覽紀錄"
          onConfirm={() => purge({ keepDays: 90 }, '已撤銷 90 天前資料')}
          disabled={data.stored.total === 0}
        />
        <ConfirmButton
          label="撤銷 30 天前資料"
          subject="30 天前的瀏覽紀錄"
          onConfirm={() => purge({ keepDays: 30 }, '已撤銷 30 天前資料')}
          disabled={data.stored.total === 0}
        />
        <ConfirmButton
          label="清空全部追蹤資料"
          subject="所有瀏覽紀錄"
          confirmWord="清空全部"
          onConfirm={() => purge({}, '已清空全部追蹤資料')}
          disabled={data.stored.total === 0}
        />
        {notice && <span className="font-mono text-xs text-ash-2">{notice}</span>}
      </DangerZone>
    </div>
  );
}

function Panel({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section className="panel p-5">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="text-sm text-bone">{title}</h2>
        {sub && <span className="font-mono text-[0.625rem] text-ash-2">{sub}</span>}
      </div>
      {children}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="display text-2xl tabular-nums">{value}</p>
      <p className="label mt-1">{label}</p>
    </div>
  );
}

function fmt(n: number): string {
  return n.toLocaleString('zh-TW');
}
