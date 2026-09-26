import Link from 'next/link';
import { LiveStats } from '@/components/LiveStats';
import { CopyIp } from '@/components/CopyIp';
import { Marquee } from '@/components/Marquee';
import { getFeatures, getLinks, getServerInfo, getSiteMeta } from '@/lib/settings';
import { guildStats } from '@/lib/discord';
import { listPublished } from '@/lib/announcements';
import { CATEGORIES } from '@/lib/announcement-types';
import { SITE } from '@/lib/content';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [server, features, siteMeta, links, announcements, discord] = await Promise.all([
    getServerInfo(),
    getFeatures(),
    getSiteMeta(),
    getLinks(),
    listPublished(3),
    guildStats(),
  ]);

  return (
    <>
      <section className="relative overflow-hidden border-b border-line">
        <div className="grid-lines absolute inset-0 opacity-40" aria-hidden />
        <div className="wrap relative grid gap-12 py-20 lg:grid-cols-12 lg:py-28">
          <div className="lg:col-span-7">
            <p className="label">minecraft survival server · since {SITE.founded}</p>
            <h1 className="display mt-5 text-[clamp(3.5rem,13vw,9rem)]">
              抽<span className="text-acid">象</span>
              <br />
              <span className="text-line-2">SERVER</span>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-relaxed text-ash">{siteMeta.about ?? SITE.tagline}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href={links.discord ?? SITE.discordInvite} target="_blank" rel="noopener noreferrer" className="btn">
                加入 Discord 社群
              </a>
              <Link href="/features" className="btn btn-ghost">
                查看玩法
              </Link>
            </div>
          </div>

          <aside className="lg:col-span-5">
            <div className="panel p-6">
              <p className="label">連線資訊</p>
              <div className="mt-4 space-y-4 font-mono text-sm">
                <Row k="IP" v={<CopyIp value={server.ip} />} />
                <Row k="PORT" v={<span className="text-bone">{server.port}</span>} />
                <Row k="版本" v={<span className="text-bone">{server.version}</span>} />
                <Row k="核心" v={<span className="text-bone">{server.core}</span>} />
                <Row k="客戶端" v={<span className="text-bone">{server.loader}</span>} />
                <Row k="Java" v={<span className="text-bone">{server.java}</span>} />
              </div>
              <div className="mt-6 flex flex-wrap gap-1.5">
                {server.modes.map((m) => (
                  <span key={m} className="border border-line-2 px-2 py-1 font-mono text-[0.6875rem] uppercase tracking-wider text-ash">
                    {m}
                  </span>
                ))}
              </div>
            </div>

            <div className="panel mt-4 p-6">
              <p className="label">Discord 社群</p>
              <p className="display mt-2 text-4xl">{discord.members || '—'}</p>
              <p className="mt-1 text-sm text-ash">
                {discord.members > 0 ? `位成員 · ${discord.online} 位上線中` : '無法即時取得'}
              </p>
            </div>
          </aside>
        </div>
      </section>

      <div className="border-b border-line bg-acid py-2 text-ink">
        <Marquee
          items={[
            '每日簽到',
            '身分稱號',
            '玩家市場',
            '抽象小遊戲',
            '領地保護',
            'AFK 掛機區',
            'Purpur 核心',
            '支援 Fabric',
            '支援 NeoForge',
            '全年無休',
          ]}
        />
      </div>

      <section className="wrap py-16">
        <LiveStats />
      </section>

      <section className="border-y border-line bg-ink-2">
        <div className="wrap py-16">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="label">02 — 玩法</p>
              <h2 className="display mt-3 text-4xl sm:text-5xl">伺服器裡有什麼</h2>
            </div>
            <Link href="/features" className="label shrink-0 transition-colors hover:text-acid">
              全部 →
            </Link>
          </div>

          <div className="mt-10 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {features.slice(0, 8).map((f, i) => (
              <article key={f.id} className="group bg-ink p-6 transition-colors hover:bg-ink-3">
                <p className="font-mono text-xs text-acid">{String(i + 1).padStart(2, '0')}</p>
                <h3 className="display mt-3 text-xl">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ash">{f.blurb}</p>
                <p className="mt-4 font-mono text-[0.625rem] uppercase tracking-wider text-ash-2">{f.plugin}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {announcements.length > 0 && (
        <section className="wrap py-16">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="label">03 — 公告</p>
              <h2 className="display mt-3 text-4xl sm:text-5xl">最新消息</h2>
            </div>
            <Link href="/announcements" className="label shrink-0 transition-colors hover:text-acid">
              全部 →
            </Link>
          </div>
          <ul className="mt-10 divide-y divide-line border-y border-line">
            {announcements.map((a) => (
              <li key={a.id}>
                <Link href={`/announcements/${a.slug}`} className="group flex flex-col gap-2 py-6 sm:flex-row sm:items-center sm:gap-8">
                  <span className="w-24 shrink-0 font-mono text-xs uppercase tracking-wider text-acid">
                    {CATEGORIES.find((c) => c.id === a.category)?.label ?? a.category}
                  </span>
                  <span className="flex-1 text-lg group-hover:text-acid">{a.title}</span>
                  <span className="font-mono text-xs text-ash-2">{a.created_at.slice(0, 10)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="border-t border-line">
        <div className="wrap py-20 text-center">
          <p className="label">04 — 加入</p>
          <h2 className="display mx-auto mt-4 max-w-4xl text-[clamp(2.5rem,8vw,6rem)]">
            今天就來<span className="text-acid">抽</span>個簽到
          </h2>
          <p className="mx-auto mt-6 max-w-lg text-ash">
            複製 IP 進遊戲，或從 Discord 取得最新活動與更新通知。
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link href="/server" className="btn">
              伺服器詳細資訊
            </Link>
            <a href={links.discord ?? SITE.discordInvite} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
              開啟 Discord 邀請
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line pb-2 last:border-0">
      <span className="label">{k}</span>
      <span className="text-right">{v}</span>
    </div>
  );
}
