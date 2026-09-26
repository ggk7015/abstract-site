import type { Metadata } from 'next';
import { CopyIp } from '@/components/CopyIp';
import { LiveStats } from '@/components/LiveStats';
import { getLinks, getServerInfo } from '@/lib/settings';
import { guildStats } from '@/lib/discord';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '伺服器資訊',
  description: '抽象 Minecraft 伺服器的連線資訊、核心、版本與社群入口。',
};

export default async function ServerPage() {
  const [server, links, discord] = await Promise.all([getServerInfo(), getLinks(), guildStats()]);

  const specs: [string, string][] = [
    ['伺服器 IP', server.ip],
    ['連接埠', String(server.port)],
    ['遊戲版本', server.version],
    ['伺服器核心', server.core],
    ['支援客戶端', server.loader],
    ['最低 Java', server.java],
    ['預設模式', server.modes.join(' · ')],
    ['最大人數', String(server.slots)],
  ];

  return (
    <div className="wrap py-16">
      <p className="label">01 — 伺服器</p>
      <h1 className="display mt-4 text-[clamp(2.5rem,9vw,6rem)]">連線資訊</h1>

      <div className="mt-10 grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <dl className="divide-y divide-line border-y border-line">
            {specs.map(([k, v]) => (
              <div key={k} className="grid gap-1 py-4 sm:grid-cols-3 sm:items-baseline">
                <dt className="label">{k}</dt>
                <dd className="font-mono text-sm text-bone sm:col-span-2">
                  {k === '伺服器 IP' ? <CopyIp value={v} /> : v}
                </dd>
              </div>
            ))}
          </dl>

          <h2 className="display mt-14 text-3xl">如何加入</h2>
          <ol className="mt-6 space-y-4">
            {[
              '啟動 Minecraft Java 版，版本 1.20.5 以上（建議 26.2）。',
              '進入多人遊戲 → 新增伺服器，貼上 abstract.pmcs.life。',
              '伺服器已安裝 ViaFabricPlus，Fabric / NeoForge / 原版客戶端都能直接進入。',
              '進場後先到簽到介面完成每日簽到，領取稱號與積分。',
            ].map((step, i) => (
              <li key={i} className="flex gap-4">
                <span className="font-mono text-xs text-acid">{String(i + 1).padStart(2, '0')}</span>
                <span className="text-sm leading-relaxed text-ash">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <aside className="lg:col-span-5">
          <div className="panel p-6">
            <p className="label">即時狀態</p>
            <div className="mt-4">
              <LiveStats />
            </div>
          </div>

          <div className="panel mt-4 p-6">
            <p className="label">社群</p>
            <p className="mt-2 text-sm text-ash">{discord.name} · {discord.members || '—'} 位成員</p>
            <a
              href={links.discord}
              target="_blank"
              rel="noopener noreferrer"
              className="btn mt-5 w-full justify-center"
            >
              立即加入
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}
