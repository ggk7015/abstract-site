import type { Metadata, Viewport } from 'next';
import './globals.css';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { PageTracker } from '@/components/PageTracker';
import { SITE } from '@/lib/content';

export const metadata: Metadata = {
  metadataBase: new URL(SITE.domain),
  title: {
    default: `${SITE.name} — ${SITE.nameEn} Minecraft 伺服器`,
    template: `%s — ${SITE.name}`,
  },
  description:
    '抽象是一個以日常養成為核心的 Minecraft 生存伺服器：每日簽到、身分稱號、玩家市場與內建小遊戲。',
  keywords: ['Minecraft', '伺服器', '生存', '抽象', 'abstract.pmcs.life', 'Purpur', 'Fabric'],
  openGraph: {
    type: 'website',
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.nameEn} Minecraft 伺服器`,
    description: '簽到、稱號、經濟、小遊戲，一個不太抽象的生存服。',
  },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#08080a',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body className="min-h-screen antialiased">
        <PageTracker />
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
