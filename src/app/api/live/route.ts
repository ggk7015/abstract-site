import { NextResponse } from 'next/server';
import { guildStats } from '@/lib/discord';
import { serverStatus } from '@/lib/mcstatus';
import { getServerInfo } from '@/lib/settings';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 15;

export async function GET() {
  const info = await getServerInfo();
  const [server, discord] = await Promise.all([
    serverStatus(info.ip, info.port),
    guildStats(),
  ]);
  return NextResponse.json({ server, discord }, { headers: { 'cache-control': 'no-store' } });
}
