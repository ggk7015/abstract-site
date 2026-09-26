import { db } from './db';
import { DEFAULT_FEATURES, DEFAULT_SERVER, type FeatureGroup, type ServerInfo } from './content';

type SettingRow = { value: unknown };

async function readSetting<T>(key: string, fallback: T): Promise<T> {
  try {
    const rows = await db()<SettingRow[]>`SELECT value FROM settings WHERE key = ${key}`;
    return (rows[0]?.value as T) ?? fallback;
  } catch {
    return fallback;
  }
}

async function writeSetting(key: string, value: unknown): Promise<void> {
  const sql = db();
  await sql`
    INSERT INTO settings (key, value) VALUES (${key}, ${sql.json(value as never)})
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()
  `;
}

export const getServerInfo = () => readSetting<ServerInfo>('server', DEFAULT_SERVER);
export const getFeatures = () => readSetting<FeatureGroup[]>('features', DEFAULT_FEATURES);

export const getSiteMeta = () =>
  readSetting<Record<string, string>>('siteMeta', {
    tagline: '簽到、稱號、經濟、小遊戲，一個不太抽象的生存服',
    about:
      '抽象是一個以「日常養成」為核心的 Minecraft 生存伺服器。每日簽到、專屬稱號、玩家市場與內建小遊戲，讓你每次上線都有新的目標。',
  });

export const getLinks = () =>
  readSetting<Record<string, string>>('links', {
    discord: 'https://discord.gg/PgHdMYSxD',
    map: 'https://map.abstract.pmcs.life',
    store: 'https://store.abstract.pmcs.life',
    github: 'https://github.com/ggk7015',
  });

export const saveServerInfo = (v: ServerInfo) => writeSetting('server', v);
export const saveFeatures = (v: FeatureGroup[]) => writeSetting('features', v);
export const saveSiteMeta = (v: Record<string, string>) => writeSetting('siteMeta', v);
export const saveLinks = (v: Record<string, string>) => writeSetting('links', v);
