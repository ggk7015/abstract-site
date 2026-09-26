import type { Metadata } from 'next';
import { getFeatures } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '玩法列表',
  description: '簽到、稱號、經濟、小遊戲、領地、掛機區 — 抽象伺服器的完整玩法。',
};

export default async function FeaturesPage() {
  const features = await getFeatures();

  return (
    <div className="wrap py-16">
      <p className="label">02 — 玩法</p>
      <h1 className="display mt-4 text-[clamp(2.5rem,9vw,6rem)]">伺服器裡有什麼</h1>
      <p className="mt-6 max-w-2xl text-ash">
        抽象的核心設計是「每次上線都有新目標」：簽到拿積分、積分換稱號、稱號代表你的投入程度，
        除此之外還有玩家市場與內建小遊戲。
      </p>

      <div className="mt-14 space-y-px bg-line">
        {features.map((f, i) => (
          <article key={f.id} className="grid gap-6 bg-ink p-6 sm:p-8 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <p className="font-mono text-xs text-acid">{String(i + 1).padStart(2, '0')}</p>
              <h2 className="display mt-2 text-3xl">{f.title}</h2>
              <p className="mt-2 font-mono text-[0.6875rem] uppercase tracking-wider text-ash-2">{f.plugin}</p>
            </div>
            <div className="lg:col-span-4">
              <p className="text-sm leading-relaxed text-ash">{f.blurb}</p>
            </div>
            <ul className="space-y-2 lg:col-span-4">
              {f.points.map((p) => (
                <li key={p} className="flex gap-3 text-sm text-bone">
                  <span className="mt-2 h-1 w-1 shrink-0 bg-acid" aria-hidden />
                  {p}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </div>
  );
}
