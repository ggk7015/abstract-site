export type Announcement = {
  id: string;
  title: string;
  slug: string;
  body: string;
  category: string;
  pinned: boolean;
  status: 'draft' | 'published' | 'archived';
  author: string;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
};

export const CATEGORIES = [
  { id: 'notice', label: '公告' },
  { id: 'event', label: '活動' },
  { id: 'update', label: '更新' },
  { id: 'patch', label: '修補' },
] as const;

export function slugify(input: string): string {
  const base = input
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
  return base || `post-${Date.now().toString(36)}`;
}
