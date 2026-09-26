import { recentMessages, hasBotToken } from '@/lib/discord';
import { DiscordPanel } from '@/components/admin/DiscordPanel';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Discord 鏡像' };

export default async function AdminDiscordPage() {
  const messages = await recentMessages(30).catch(() => []);
  return <DiscordPanel initial={messages} botConfigured={hasBotToken()} />;
}
