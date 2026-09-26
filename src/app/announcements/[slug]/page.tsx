import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getBySlug, listPublished } from '@/lib/announcements';
import { CATEGORIES } from '@/lib/announcement-types';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBySlug(slug);
  return { title: post?.title ?? '公告' };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getBySlug(slug);
  if (!post) notFound();

  const related = (await listPublished(6)).filter((a) => a.slug !== post.slug).slice(0, 3);

  return (
    <div className="wrap py-16">
      <article className="mx-auto max-w-3xl">
        <p className="label">
          {CATEGORIES.find((c) => c.id === post.category)?.label ?? post.category} · {post.created_at.slice(0, 10)}
        </p>
        <h1 className="display mt-4 text-[clamp(2rem,6vw,3.5rem)]">{post.title}</h1>
        <p className="mt-4 font-mono text-xs text-ash-2">發布者：{post.author}</p>

        <div className="mt-10 space-y-4 text-[0.95rem] leading-[1.85] text-ash">
          {post.body.split('\n').map((line, i) =>
            line.trim() ? <p key={i}>{line}</p> : <div key={i} className="h-2" />,
          )}
        </div>
      </article>

      {related.length > 0 && (
        <aside className="mx-auto mt-20 max-w-3xl border-t border-line pt-8">
          <p className="label">相關公告</p>
          <ul className="mt-4 space-y-3">
            {related.map((a) => (
              <li key={a.id}>
                <a href={`/announcements/${a.slug}`} className="text-sm text-bone transition-colors hover:text-acid">
                  {a.title}
                </a>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </div>
  );
}
