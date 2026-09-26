import Link from 'next/link';
import { SITE } from '@/lib/content';

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line bg-ink-2">
      <div className="wrap grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="display text-5xl">
            抽<span className="text-acid">象</span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-ash">
            {SITE.tagline}。伺服器運作於 Purpur 核心，支援 Fabric、NeoForge 與原版客戶端。
          </p>
          <p className="label mt-6">伺服器 IP</p>
          <p className="font-mono text-sm text-acid">abstract.pmcs.life</p>
        </div>

        <nav aria-label="頁尾導覽">
          <p className="label mb-3">網站</p>
          <ul className="space-y-2 text-sm">
            {[
              ['/server', '伺服器資訊'],
              ['/features', '玩法列表'],
              ['/announcements', '公告'],
              ['/community', 'Discord 社群'],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="text-ash transition-colors hover:text-acid">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className="label mb-3">外部連結</p>
          <ul className="space-y-2 text-sm">
            <li>
              <a
                href={SITE.discordInvite}
                target="_blank"
                rel="noopener noreferrer"
                className="text-ash transition-colors hover:text-acid"
              >
                Discord 邀請
              </a>
            </li>
            <li>
              <a
                href={SITE.repo}
                target="_blank"
                rel="noopener noreferrer"
                className="text-ash transition-colors hover:text-acid"
              >
                GitHub
              </a>
            </li>
            <li>
              <Link href="/admin" className="text-ash-2 transition-colors hover:text-acid">
                後台登入
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="wrap flex flex-col gap-2 py-5 text-xs text-ash-2 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {SITE.name} 伺服器 · 非 Mojang Studios 官方產品
          </p>
          <p className="font-mono">purpur · paper · fabric · neoforge</p>
        </div>
      </div>
    </footer>
  );
}
