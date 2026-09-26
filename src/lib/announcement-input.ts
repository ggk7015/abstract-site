import type { AnnouncementInput } from './announcements';

const VALID_STATUS = ['draft', 'published', 'archived'];
const VALID_CATEGORY = ['notice', 'event', 'update', 'patch'];

export function parseAnnouncementInput(raw: Record<string, unknown>, author: string): AnnouncementInput {
  const status = VALID_STATUS.includes(String(raw.status)) ? String(raw.status) : 'draft';
  const category = VALID_CATEGORY.includes(String(raw.category)) ? String(raw.category) : 'notice';
  return {
    title: String(raw.title ?? '').trim().slice(0, 160) || '未命名公告',
    body: String(raw.body ?? '').slice(0, 20_000),
    category,
    pinned: Boolean(raw.pinned),
    status: status as AnnouncementInput['status'],
    author: String(raw.author ?? author).slice(0, 60),
    starts_at: toIso(raw.starts_at),
    ends_at: toIso(raw.ends_at),
  };
}

function toIso(value: unknown): string | null {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
