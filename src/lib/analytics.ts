import { db } from './db';

export type TrendPoint = { day: string; pv: number; uv: number };
export type Breakdown = { label: string; pv: number; uv: number };
export type HeatCell = { weekday: number; hour: number; count: number };

type Empty = {
  totalPv: number; totalUv: number; todayPv: number; todayUv: number;
  yesterdayPv: number; yesterdayUv: number; pvDelta: number; uvDelta: number;
  liveNow: number; avgDurationMs: number;
};

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

function pct(now: number, before: number): number {
  if (before === 0) return now === 0 ? 0 : 100;
  return Math.round(((now - before) / before) * 1000) / 10;
}

const ZERO: Empty = {
  totalPv: 0, totalUv: 0, todayPv: 0, todayUv: 0,
  yesterdayPv: 0, yesterdayUv: 0, pvDelta: 0, uvDelta: 0,
  liveNow: 0, avgDurationMs: 0,
};

export async function summary(): Promise<Empty> {
  return safe(async () => {
    const sql = db();
    const [totals] = await sql<{ pv: number; uv: number }[]>`
      SELECT count(*)::bigint AS pv, count(DISTINCT visitor_id)::bigint AS uv FROM page_views`;
    const [today] = await sql<{ pv: number; uv: number }[]>`
      SELECT count(*)::bigint AS pv, count(DISTINCT visitor_id)::bigint AS uv
      FROM page_views WHERE created_at >= date_trunc('day', now())`;
    const [yesterday] = await sql<{ pv: number; uv: number }[]>`
      SELECT count(*)::bigint AS pv, count(DISTINCT visitor_id)::bigint AS uv
      FROM page_views WHERE created_at >= date_trunc('day', now() - interval '1 day')
        AND created_at <  date_trunc('day', now())`;
    const [live] = await sql<{ n: number }[]>`
      SELECT count(DISTINCT visitor_id)::bigint AS n FROM page_views
      WHERE created_at >= now() - interval '5 minutes'`;
    const [avg] = await sql<{ ms: number }[]>`
      SELECT COALESCE(avg(duration_ms), 0)::bigint AS ms FROM page_views
      WHERE duration_ms IS NOT NULL AND created_at >= now() - interval '7 days'`;

    return {
      totalPv: Number(totals?.pv ?? 0),
      totalUv: Number(totals?.uv ?? 0),
      todayPv: Number(today?.pv ?? 0),
      todayUv: Number(today?.uv ?? 0),
      yesterdayPv: Number(yesterday?.pv ?? 0),
      yesterdayUv: Number(yesterday?.uv ?? 0),
      pvDelta: pct(Number(today?.pv ?? 0), Number(yesterday?.pv ?? 0)),
      uvDelta: pct(Number(today?.uv ?? 0), Number(yesterday?.uv ?? 0)),
      liveNow: Number(live?.n ?? 0),
      avgDurationMs: Number(avg?.ms ?? 0),
    };
  }, ZERO);
}

const TREND_SQL = `
  SELECT d::date AS day,
         COALESCE(v.pv, 0) AS pv,
         COALESCE(v.uv, 0) AS uv
  FROM generate_series(date_trunc('day', now()) - ($1::int - 1) * interval '1 day',
                       date_trunc('day', now()), interval '1 day') AS d
  LEFT JOIN (
    SELECT created_at::date AS day, count(*) AS pv, count(DISTINCT visitor_id) AS uv
    FROM page_views WHERE created_at >= now() - $1::int * interval '1 day'
    GROUP BY 1
  ) v ON v.day = d::date
  ORDER BY 1`;

export async function trend(days = 30): Promise<TrendPoint[]> {
  return safe(async () => {
    const rows = await db().unsafe<{ day: Date; pv: number; uv: number }[]>(TREND_SQL, [days]);
    return rows.map((r) => ({ day: r.day.toISOString().slice(0, 10), pv: Number(r.pv), uv: Number(r.uv) }));
  }, []);
}

const GROUP_SQL = (column: string, alias: string) => `
  SELECT COALESCE(NULLIF(${column}, ''), '未知') AS ${alias},
         count(*) AS pv, count(DISTINCT visitor_id) AS uv
  FROM page_views WHERE created_at >= now() - $1::int * interval '1 day'
  GROUP BY 1 ORDER BY pv DESC`;

async function grouped(column: string, alias: string, days: number): Promise<Breakdown[]> {
  return safe(async () => {
    const rows = await db().unsafe<Record<string, string>[]>(GROUP_SQL(column, alias), [days]);
    return rows.map((r) => ({ label: r[alias], pv: Number(r.pv), uv: Number(r.uv) }));
  }, []);
}

export const topPages = (limit = 8, days = 30): Promise<Breakdown[]> =>
  safe(async () => {
    const rows = await db().unsafe<{ path: string; pv: number; uv: number }[]>(
      `SELECT path, count(*) AS pv, count(DISTINCT visitor_id) AS uv
       FROM page_views WHERE created_at >= now() - $1::int * interval '1 day'
       GROUP BY path ORDER BY pv DESC LIMIT $2`,
      [days, limit],
    );
    return rows.map((r) => ({ label: r.path, pv: Number(r.pv), uv: Number(r.uv) }));
  }, []);

export const sources = (days = 30): Promise<Breakdown[]> => grouped('host', 'host', days);
export const devices = (days = 30): Promise<Breakdown[]> => grouped('device', 'device', days);
export const browsers = (days = 30): Promise<Breakdown[]> => grouped('browser', 'browser', days);

export async function hourlyHeat(days = 30): Promise<HeatCell[]> {
  return safe(async () => {
    const rows = await db().unsafe<{ weekday: number; hour: number; count: number }[]>(
      `SELECT EXTRACT(DOW FROM created_at)::int AS weekday,
              EXTRACT(HOUR FROM created_at)::int AS hour,
              count(*) AS count
       FROM page_views WHERE created_at >= now() - $1::int * interval '1 day'
       GROUP BY 1, 2`,
      [days],
    );
    return rows.map((r) => ({ weekday: r.weekday, hour: r.hour, count: Number(r.count) }));
  }, []);
}

export type DiscordActivity = {
  total: number;
  today: number;
  authors: number;
  series: { day: string; count: number }[];
  top: Breakdown[];
};

export async function discordActivity(days = 30): Promise<DiscordActivity> {
  return safe(async () => {
    const sql = db();
    const [totals] = await sql<{ total: number; today: number; authors: number }[]>`
      SELECT count(*)::bigint AS total,
             count(*) FILTER (WHERE created_at >= date_trunc('day', now()))::bigint AS today,
             count(DISTINCT author_id)::bigint AS authors
      FROM discord_messages`;
    const series = await sql<{ day: Date; count: number }[]>`
      SELECT created_at::date AS day, count(*) AS count FROM discord_messages
      WHERE created_at >= now() - ${`${days} days`}::interval
      GROUP BY 1 ORDER BY 1`;
    const top = await sql<{ author_name: string; count: number }[]>`
      SELECT author_name, count(*) AS count FROM discord_messages
      GROUP BY author_name ORDER BY count DESC LIMIT 8`;
    return {
      total: Number(totals?.total ?? 0),
      today: Number(totals?.today ?? 0),
      authors: Number(totals?.authors ?? 0),
      series: series.map((r) => ({ day: r.day.toISOString().slice(0, 10), count: Number(r.count) })),
      top: top.map((r) => ({ label: r.author_name, pv: Number(r.count), uv: 0 })),
    };
  }, { total: 0, today: 0, authors: 0, series: [], top: [] });
}
