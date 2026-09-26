import type { Metadata } from 'next';
import { MessageMirror } from '@/components/MessageMirror';
import { guildStats } from '@/lib/discord';
import { getLinks } from '@/lib/settings';
import { SITE } from '@/lib/content';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Discord 社群',
  description: '加入抽象的 Discord 社群，取得活動通知與遊戲內聊天同步。',
};

export default async function CommunityPage() {
  const [discord, links] = await Promise.all([guildStats(), getLinks()]);
  const invite = links.discord ?? SITE.discordInvite;

  return (
    <div className="wrap py-16">
      <p className="label">04 — 社群</p>
      <h1 className="display mt-4 text-[clamp(2.5rem,9vw,6rem)]">一起來聊天</h1>

      <div className="mt-12 grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <h2 className="display text-2xl">#{SITE.discordChannelName}</h2>
          <p className="mt-2 text-sm text-ash">
            遊戲內聊天會同步到這個頻道。不用開遊戲也能看到伺服器在幹嘛。
          </p>
          <div className="mt-6">
            <MessageMirror />
          </div>
        </div>

        <aside className="lg:col-span-5">
          <div className="panel p-6">
            <p className="label">社群數據</p>
            <dl className="mt-4 space-y-3 font-mono text-sm">
              <div className="flex justify-between border-b border-line pb-2">
                <dt className="text-ash-2">伺服器名稱</dt>
                <dd>{discord.name}</dd>
              </div>
              <div className="flex justify-between border-b border-line pb-2">
                <dt className="text-ash-2">成員</dt>
                <dd className="text-acid">{discord.members || '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ash-2">上線中</dt>
                <dd className="text-acid">{discord.online || '—'}</dd>
              </div>
            </dl>
            <a href={invite} target="_blank" rel="noopener noreferrer" className="btn mt-6 w-full justify-center">
              加入 Discord
            </a>
            <p className="mt-3 break-all text-center font-mono text-[0.625rem] text-ash-2">{invite}</p>
          </div>

          <div className="panel mt-4 p-6">
            <p className="label">其他入口</p>
            <ul className="mt-4 space-y-3 text-sm">
              {Object.entries(links)
                .filter(([k]) => k !== 'discord')
                .map(([k, v]) => (
                  <li key={k} className="flex items-baseline justify-between gap-3">
                    <span className="text-ash-2">{k}</span>
                    <a href={v} target="_blank" rel="noopener noreferrer" className="truncate text-bone hover:text-acid">
                      {v.replace(/^https?:\/\//, '')}
                    </a>
                  </li>
                ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
