import { NextResponse } from 'next/server';
import { requireUser, apiError } from '@/lib/guard';
import {
  browsers, devices, discordActivity, hourlyHeat, pageViewStats, purgePageViews,
  sources, summary, topPages, trend,
} from '@/lib/analytics';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(request: Request) {
  const { error } = await requireUser();
  if (error) return error;

  const raw = Number(new URL(request.url).searchParams.get('days') ?? 30);
  const days = [7, 30, 90].includes(raw) ? raw : 30;

  const [overview, series, pages, referrers, deviceList, browserList, heat, discord, stored] = await Promise.all([
    summary(),
    trend(days),
    topPages(10, days),
    sources(days),
    devices(days),
    browsers(days),
    hourlyHeat(days),
    discordActivity(days),
    pageViewStats(),
  ]);

  return NextResponse.json({
    days, overview, series, pages, referrers,
    devices: deviceList, browsers: browserList, heat, discord, stored,
  });
}

/**
 * 撤銷流量追蹤資料。
 *
 *   DELETE /api/admin/insights                    → 清空全部 page_views
 *   DELETE /api/admin/insights { before: ISO }    → 只刪除該時間點之前
 *   DELETE /api/admin/insights { keepDays: 30 }   → 保留最近 N 天
 */
export async function DELETE(request: Request) {
  const { error } = await requireUser();
  if (error) return error;

  const raw = (await request.json().catch(() => ({}))) as { before?: unknown; keepDays?: unknown };

  let cutoff: Date | null = null;
  if (typeof raw.before === 'string') {
    const parsed = new Date(raw.before);
    if (Number.isNaN(parsed.getTime())) {
      return NextResponse.json({ error: 'before 不是合法的時間格式' }, { status: 400 });
    }
    cutoff = parsed;
  } else if (raw.keepDays !== undefined) {
    const days = Number(raw.keepDays);
    if (!Number.isFinite(days) || days < 0 || days > 3650) {
      return NextResponse.json({ error: 'keepDays 必須是 0–3650 的數字' }, { status: 400 });
    }
    cutoff = new Date(Date.now() - days * 86_400_000);
  }

  try {
    const removed = await purgePageViews(cutoff);
    return NextResponse.json({ ok: true, removed, cutoff: cutoff?.toISOString() ?? null });
  } catch (err) {
    return apiError(err, 500, 'failed to purge page views');
  }
}
