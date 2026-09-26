import type { Metadata } from 'next';
import Link from 'next/link';
import { listPublished } from '@/lib/announcements';
import { CATEGORIES } from '@/lib/announcement-types';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '公告',
  description: '抽象伺服器的公告、活動與更新記錄。',
};

export default async function AnnouncementsPage() {
  const items = await listPublished(100);
  const active = CATEGORIES[0].id;

  return (
    <div className="wrap py-16">
      <p className="label">03 — 公告</p>
      <h1 className="display mt-4 text-[clamp(2.5rem,9vw,6rem)]">最新消息</h1>

      {items.length === 0 ? (
        <p className="mt-16 border border-dashed border-line-2 p-10 text-center text-sm text-ash-2">
          目前沒有公告。
        </p>
      ) : (
        <ul className="mt-14 divide-y divide-line border-y border-line">
          {items.map((a) => (
            <li key={a.id}>
              <Link
                href={`/announcements/${a.slug}`}
                className="group grid gap-2 py-6 sm:grid-cols-12 sm:items-baseline sm:gap-6"
              >
                <span className="font-mono text-xs text-acid sm:col-span-2">
                  {CATEGORIES.find((c) => c.id === a.category)?.label ?? a.category}
                </span>
                <span className="text-lg group-hover:text-acid sm:col-span-7">
                  {a.pinned && <span className="mr-2 text-[0.625rem] uppercase tracking-widest text-ash-2">置頂</span>}
                  {a.title}
                </span>
                <span className="font-mono text-xs text-ash-2 sm:col-span-3 sm:text-right">
                  {a.created_at.slice(0, 10)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-8 font-mono text-xs text-ash-2">分類：{active}</p>
    </div>
  );
}
