import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { AdminNav } from '@/components/AdminNav';

export const dynamic = 'force-dynamic';

export default async function DashLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect('/admin/login');

  return (
    <>
      <div className="mb-8 flex items-baseline justify-between border-b border-line pb-4">
        <h1 className="display text-3xl">
          控制台<span className="text-acid">_</span>
        </h1>
        <p className="font-mono text-xs text-ash-2">{user.username}</p>
      </div>
      <div className="flex flex-col gap-8 lg:flex-row">
        <aside className="lg:w-48 lg:shrink-0">
          <p className="label mb-3">選單</p>
          <AdminNav />
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </>
  );
}
