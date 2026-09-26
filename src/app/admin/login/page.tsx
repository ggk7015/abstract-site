import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { LoginForm } from './LoginForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: '後台登入' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ changed?: string }>;
}) {
  if (await currentUser()) redirect('/admin');
  const { changed } = await searchParams;

  return (
    <div className="mx-auto max-w-sm py-16">
      <h1 className="display text-3xl">
        控制台<span className="text-acid">_</span>
      </h1>
      <p className="mt-3 text-sm text-ash">使用後台帳號登入以管理公告、網站設定與洞察報告。</p>

      {changed === '1' && (
        <p className="mt-6 border border-acid/40 bg-acid/5 p-3 text-xs leading-relaxed text-acid">
          密碼已變更，所有裝置已登出。請使用新密碼重新登入。
        </p>
      )}

      <div className="mt-8">
        <LoginForm />
      </div>
    </div>
  );
}
