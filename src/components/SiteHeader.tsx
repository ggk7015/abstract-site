'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { SITE } from '@/lib/content';

const LINKS = [
  { href: '/', label: '首頁' },
  { href: '/server', label: '伺服器' },
  { href: '/features', label: '玩法' },
  { href: '/announcements', label: '公告' },
  { href: '/community', label: '社群' },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-ink/85 backdrop-blur-md">
      <div className="wrap flex h-16 items-center justify-between gap-4">
        <Link href="/" className="group flex items-center gap-3" aria-label={`${SITE.name} 首頁`}>
          <span className="grid h-9 w-9 place-items-center border border-acid bg-acid text-ink">
            <span className="display text-lg leading-none">抽</span>
          </span>
          <span className="hidden sm:block">
            <span className="display block text-lg leading-none">{SITE.name}</span>
            <span className="label block text-[0.5625rem]">abstract server</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="主選單">
          {LINKS.map((l) => {
            const active = l.href === '/' ? pathname === '/' : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`px-3 py-2 font-mono text-xs uppercase tracking-[0.14em] transition-colors ${
                  active ? 'text-acid' : 'text-ash hover:text-bone'
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={SITE.discordInvite}
            target="_blank"
            rel="noopener noreferrer"
            className="btn hidden sm:inline-flex"
          >
            加入 Discord
          </a>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="btn btn-ghost md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label="切換選單"
          >
            {open ? '✕' : '≡'}
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-nav" className="border-t border-line md:hidden" aria-label="行動版選單">
          <div className="wrap flex flex-col py-2">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="border-b border-line py-3 font-mono text-xs uppercase tracking-[0.14em] text-ash last:border-0 hover:text-acid"
              >
                {l.label}
              </Link>
            ))}
            <a
              href={SITE.discordInvite}
              target="_blank"
              rel="noopener noreferrer"
              className="btn mt-4 justify-center"
            >
              加入 Discord
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}
