import { db } from './db';
import { slugify, type Announcement } from './announcement-types';

type Row = {
  id: string;
  title: string;
  slug: string;
  body: string;
  category: string;
  pinned: boolean;
  status: Announcement['status'];
  author: string;
  starts_at: Date | null;
  ends_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

function toModel(r: Row): Announcement {
  return { ...r, starts_at: r.starts_at?.toISOString() ?? null, ends_at: r.ends_at?.toISOString() ?? null, created_at: r.created_at.toISOString(), updated_at: r.updated_at.toISOString() };
}

const COLUMNS = sql_cols();

function sql_cols() {
  return 'id, title, slug, body, category, pinned, status, author, starts_at, ends_at, created_at, updated_at';
}

export async function listPublished(limit = 50): Promise<Announcement[]> {
  const sql = db();
  const rows = await sql.unsafe<Row[]>(
    `SELECT ${COLUMNS} FROM announcements
     WHERE status = 'published'
       AND (starts_at IS NULL OR starts_at <= now())
       AND (ends_at IS NULL OR ends_at >= now())
     ORDER BY pinned DESC, created_at DESC
     LIMIT $1`,
    [limit],
  );
  return rows.map(toModel);
}

export async function listAll(): Promise<Announcement[]> {
  const sql = db();
  const rows = await sql.unsafe<Row[]>(
    `SELECT ${COLUMNS} FROM announcements ORDER BY pinned DESC, created_at DESC`,
  );
  return rows.map(toModel);
}

export async function getBySlug(slug: string): Promise<Announcement | null> {
  const sql = db();
  const rows = await sql.unsafe<Row[]>(
    `SELECT ${COLUMNS} FROM announcements WHERE slug = $1 AND status = 'published'`,
    [slug],
  );
  return rows[0] ? toModel(rows[0]) : null;
}

export type AnnouncementInput = {
  title: string;
  body: string;
  category: string;
  pinned: boolean;
  status: Announcement['status'];
  author: string;
  starts_at: string | null;
  ends_at: string | null;
};

export async function create(input: AnnouncementInput): Promise<Announcement> {
  const sql = db();
  const slug = `${slugify(input.title)}-${Math.random().toString(36).slice(2, 6)}`;
  const rows = await sql<Row[]>`
    INSERT INTO announcements (title, slug, body, category, pinned, status, author, starts_at, ends_at)
    VALUES (${input.title}, ${slug}, ${input.body}, ${input.category}, ${input.pinned},
            ${input.status}, ${input.author}, ${input.starts_at}, ${input.ends_at})
    RETURNING ${sql.unsafe(COLUMNS)}
  `;
  return toModel(rows[0]);
}

export async function update(id: string, input: AnnouncementInput): Promise<Announcement | null> {
  const sql = db();
  const rows = await sql<Row[]>`
    UPDATE announcements SET
      title = ${input.title}, body = ${input.body}, category = ${input.category},
      pinned = ${input.pinned}, status = ${input.status}, author = ${input.author},
      starts_at = ${input.starts_at}, ends_at = ${input.ends_at}, updated_at = now()
    WHERE id = ${id}
    RETURNING ${sql.unsafe(COLUMNS)}
  `;
  return rows[0] ? toModel(rows[0]) : null;
}

export async function remove(id: string): Promise<boolean> {
  const sql = db();
  const rows = await sql<{ id: string }[]>`DELETE FROM announcements WHERE id = ${id} RETURNING id`;
  return rows.length > 0;
}
