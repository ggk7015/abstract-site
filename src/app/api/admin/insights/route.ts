import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/guard';
import { browsers, devices, discordActivity, hourlyHeat, sources, summary, topPages, trend } from '@/lib/analytics';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(request: Request) {
  const { error } = await requireUser();
  if (error) return error;

  const raw = Number(new URL(request.url).searchParams.get('days') ?? 30);
  const days = [7, 30, 90].includes(raw) ? raw : 30;

  const [overview, series, pages, referrers, deviceList, browserList, heat, discord] = await Promise.all([
    summary(),
    trend(days),
    topPages(10, days),
    sources(days),
    devices(days),
    browsers(days),
    hourlyHeat(days),
    discordActivity(days),
  ]);

  return NextResponse.json({ days, overview, series, pages, referrers, devices: deviceList, browsers: browserList, heat, discord });
}
