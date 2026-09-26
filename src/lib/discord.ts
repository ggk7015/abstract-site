import { db, HAS_DB } from './db';
import { safeError } from './redact';

export type DiscordGuildStats = {
  name: string;
  members: number;
  online: number;
  invite: string;
  fetchedAt: string;
  error?: string;
};

export type DiscordMessage = {
  id: string;
  channelId: string;
  channelName: string | null;
  authorId: string | null;
  authorName: string | null;
  authorAvatar: string | null;
  authorBot: boolean;
  content: string;
  createdAt: string;
};

const INVITE = process.env.NEXT_PUBLIC_DISCORD_INVITE || 'https://discord.gg/PgHdMYSxD';
const DEFAULT_CODE = INVITE.split('/').pop() || 'PgHdMYSxD';

/**
 * 資訊安全需求：bot token 等同機器人完整權限，屬最高機敏。
 * 絕對不可出現在 HTTP 回應、日誌或錯誤訊息中；
 * 錯誤一律經 `safeError()` 遮罩（見 SECURITY.md）。
 */
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || '';
const CHANNEL_ID = process.env.DISCORD_CHANNEL_ID || '';
const API = 'https://discord.com/api/v10';

export async function guildStats(): Promise<DiscordGuildStats> {
  const base = { name: '抽象', members: 0, online: 0, invite: INVITE, fetchedAt: new Date().toISOString() };
  try {
    const res = await fetch(`${API}/invites/${DEFAULT_CODE}?with_counts=true&with_expiration=true`, {
      headers: { 'user-agent': 'abstract-site' },
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return {
      name: data.guild?.name ?? base.name,
      members: data.approximate_member_count ?? 0,
      online: data.approximate_presence_count ?? 0,
      invite: INVITE,
      fetchedAt: new Date().toISOString(),
    };
  } catch (err) {
    return { ...base, error: safeError(err, 80) };
  }
}

export const hasBotToken = () => BOT_TOKEN.length > 0;

type ApiMessage = {
  id: string;
  channel_id: string;
  content: string;
  timestamp: string;
  author: { id: string; username: string; global_name?: string | null; avatar?: string | null; bot?: boolean };
};

function avatarUrl(author: ApiMessage['author']): string | null {
  if (!author.avatar) return null;
  const ext = author.avatar.startsWith('a_') ? 'gif' : 'png';
  return `https://cdn.discordapp.com/avatars/${author.id}/${author.avatar}.${ext}?size=64`;
}

export async function fetchRecentMessages(limit = 50): Promise<DiscordMessage[]> {
  if (!BOT_TOKEN || !CHANNEL_ID) throw new Error('DISCORD_BOT_TOKEN / DISCORD_CHANNEL_ID 未設定');
  const res = await fetch(`${API}/channels/${CHANNEL_ID}/messages?limit=${Math.min(limit, 100)}`, {
    headers: { authorization: `Bot ${BOT_TOKEN}`, 'user-agent': 'abstract-site' },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Discord API HTTP ${res.status}`);
  const data: ApiMessage[] = await res.json();
  return data
    .filter((m) => !m.author.bot)
    .map((m) => ({
      id: m.id,
      channelId: m.channel_id,
      channelName: null,
      authorId: m.author.id,
      authorName: m.author.global_name || m.author.username,
      authorAvatar: avatarUrl(m.author),
      authorBot: Boolean(m.author.bot),
      content: m.content,
      createdAt: m.timestamp,
    }));
}

export async function syncMessages(limit = 50): Promise<{ inserted: number; fetched: number }> {
  const messages = await fetchRecentMessages(limit);
  const sql = db();
  let inserted = 0;
  for (const m of messages) {
    const rows = await sql<{ id: string }[]>`
      INSERT INTO discord_messages (id, channel_id, channel_name, author_id, author_name, author_avatar, author_bot, content, created_at)
      VALUES (${m.id}, ${m.channelId}, ${m.channelName}, ${m.authorId}, ${m.authorName}, ${m.authorAvatar}, ${m.authorBot}, ${m.content}, ${m.createdAt})
      ON CONFLICT (id) DO NOTHING
      RETURNING id`;
    inserted += rows.length;
  }
  return { inserted, fetched: messages.length };
}

export async function storeIncoming(input: DiscordMessage): Promise<boolean> {
  const sql = db();
  const rows = await sql<{ id: string }[]>`
    INSERT INTO discord_messages (id, channel_id, channel_name, author_id, author_name, author_avatar, author_bot, content, created_at)
    VALUES (${input.id}, ${input.channelId}, ${input.channelName}, ${input.authorId}, ${input.authorName}, ${input.authorAvatar}, ${input.authorBot}, ${input.content}, ${input.createdAt})
    ON CONFLICT (id) DO NOTHING
    RETURNING id`;
  return rows.length > 0;
}

export async function recentMessages(limit = 30): Promise<DiscordMessage[]> {
  if (!HAS_DB) return [];
  const sql = db();
  const rows = await sql<
    { id: string; channel_id: string; channel_name: string | null; author_id: string | null; author_name: string | null; author_avatar: string | null; author_bot: boolean; content: string; created_at: Date }[]
  >`
    SELECT id, channel_id, channel_name, author_id, author_name, author_avatar, author_bot, content, created_at
    FROM discord_messages ORDER BY created_at DESC LIMIT ${limit}`;
  return rows.map((r) => ({
    id: r.id,
    channelId: r.channel_id,
    channelName: r.channel_name,
    authorId: r.author_id,
    authorName: r.author_name,
    authorAvatar: r.author_avatar,
    authorBot: r.author_bot,
    content: r.content,
    createdAt: r.created_at.toISOString(),
  }));
}

/** 撤銷單則鏡像訊息。回傳是否確實刪除。 */
export async function deleteMessage(id: string): Promise<boolean> {
  const rows = await db()<{ id: string }[]>`DELETE FROM discord_messages WHERE id = ${id} RETURNING id`;
  return rows.length > 0;
}

/** 撤銷全部鏡像訊息。回傳刪除筆數。 */
export async function clearMessages(): Promise<number> {
  const rows = await db()<{ id: string }[]>`DELETE FROM discord_messages RETURNING id`;
  return rows.length;
}
