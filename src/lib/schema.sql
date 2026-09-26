CREATE TABLE IF NOT EXISTS settings (
  key         text PRIMARY KEY,
  value       jsonb NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username      text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  token      text PRIMARY KEY,
  user_id    uuid NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sessions_expires_idx ON sessions (expires_at);

CREATE TABLE IF NOT EXISTS announcements (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title      text NOT NULL,
  slug       text UNIQUE NOT NULL,
  body       text NOT NULL DEFAULT '',
  category   text NOT NULL DEFAULT 'notice',
  pinned     boolean NOT NULL DEFAULT false,
  status     text NOT NULL DEFAULT 'published',
  author     text NOT NULL DEFAULT 'admin',
  starts_at  timestamptz,
  ends_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS announcements_status_idx ON announcements (status, pinned DESC, created_at DESC);

CREATE TABLE IF NOT EXISTS page_views (
  id          bigserial PRIMARY KEY,
  path        text NOT NULL,
  host        text,
  visitor_id  text NOT NULL,
  device      text,
  browser     text,
  country     text,
  duration_ms integer,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS page_views_created_idx ON page_views (created_at DESC);
CREATE INDEX IF NOT EXISTS page_views_visitor_idx ON page_views (visitor_id);
CREATE INDEX IF NOT EXISTS page_views_path_idx ON page_views (path);

CREATE TABLE IF NOT EXISTS discord_messages (
  id           text PRIMARY KEY,
  channel_id   text NOT NULL,
  channel_name text,
  author_id    text,
  author_name  text,
  author_avatar text,
  author_bot   boolean NOT NULL DEFAULT false,
  content      text NOT NULL DEFAULT '',
  embeds       jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at   timestamptz NOT NULL,
  synced_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS discord_messages_created_idx ON discord_messages (created_at DESC);
CREATE INDEX IF NOT EXISTS discord_messages_author_idx ON discord_messages (author_name);
