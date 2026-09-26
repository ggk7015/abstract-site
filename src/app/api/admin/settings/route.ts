import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/guard';
import { getFeatures, getLinks, getServerInfo, getSiteMeta, saveFeatures, saveLinks, saveServerInfo, saveSiteMeta } from '@/lib/settings';
import type { FeatureGroup, ServerInfo } from '@/lib/content';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const { error } = await requireUser();
  if (error) return error;

  const [server, features, siteMeta, links] = await Promise.all([
    getServerInfo(),
    getFeatures(),
    getSiteMeta(),
    getLinks(),
  ]);
  return NextResponse.json({ server, features, siteMeta, links });
}

function parseServer(raw: Record<string, unknown>): ServerInfo {
  return {
    ip: String(raw.ip ?? '').trim().slice(0, 120) || 'abstract.pmcs.life',
    port: Math.min(65535, Math.max(1, Number(raw.port) || 25565)),
    version: String(raw.version ?? '').slice(0, 40),
    core: String(raw.core ?? '').slice(0, 60),
    loader: String(raw.loader ?? '').slice(0, 120),
    java: String(raw.java ?? '').slice(0, 40),
    modes: Array.isArray(raw.modes) ? raw.modes.slice(0, 12).map((m) => String(m).slice(0, 30)) : [],
    slots: Math.max(0, Number(raw.slots) || 0),
  };
}

function parseFeatures(raw: unknown): FeatureGroup[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 24).map((item, i) => {
    const f = item as Record<string, unknown>;
    return {
      id: String(f.id ?? `f${i}`).slice(0, 40),
      title: String(f.title ?? '未命名').slice(0, 60),
      plugin: String(f.plugin ?? '').slice(0, 80),
      blurb: String(f.blurb ?? '').slice(0, 240),
      points: Array.isArray(f.points) ? f.points.slice(0, 6).map((p) => String(p).slice(0, 120)) : [],
    };
  });
}

function parseStringMap(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== 'object') return {};
  return Object.fromEntries(
    Object.entries(raw as Record<string, unknown>)
      .slice(0, 20)
      .map(([k, v]) => [String(k).slice(0, 40), String(v).slice(0, 300)]),
  );
}

export async function PUT(request: Request) {
  const { error } = await requireUser();
  if (error) return error;

  const raw = await request.json().catch(() => ({}));
  await Promise.all([
    saveServerInfo(parseServer(raw.server ?? {})),
    saveFeatures(parseFeatures(raw.features)),
    saveSiteMeta(parseStringMap(raw.siteMeta)),
    saveLinks(parseStringMap(raw.links)),
  ]);
  return NextResponse.json({ ok: true });
}
