import { Suspense } from 'react';
import { Insights } from '@/components/admin/Insights';

export const dynamic = 'force-dynamic';
export const metadata = { title: '洞察總覽' };

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<p className="font-mono text-xs text-ash-2">載入中…</p>}>
      <Insights />
    </Suspense>
  );
}
