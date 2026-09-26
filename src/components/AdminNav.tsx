'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

const NAV = [
  { href: '/admin', label: '總覽', exact: true },
  { href: '/admin/announcements', label: '公告管理' },
  { href: '/admin/settings', label: '網站設定' },
  { href: '/admin/discord', label: 'Discord 鏡像' },
  { href: '/admin/account', label: '帳號安全' },
];

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const logout = async () => {
    setBusy(true);
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  };

  const active = (item: (typeof NAV)[number]) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <nav className="flex gap-1 overflow-x-auto lg:flex-col" aria-label="後台選單">
      {NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`shrink-0 border px-3 py-2 font-mono text-xs uppercase tracking-[0.12em] transition-colors ${
            active(item) ? 'border-acid bg-acid text-ink' : 'border-line text-ash hover:border-line-2 hover:text-bone'
          }`}
        >
          {item.label}
        </Link>
      ))}
      <button
        type="button"
        onClick={logout}
        disabled={busy}
        className="shrink-0 border border-line px-3 py-2 text-left font-mono text-xs uppercase tracking-[0.12em] text-ash-2 transition-colors hover:border-blood hover:text-blood disabled:opacity-50"
      >
        登出
      </button>
    </nav>
  );
}
