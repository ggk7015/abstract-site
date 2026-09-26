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

/** 可被還原的設定鍵。`resetSetting` 只接受此清單，避免任意 key 注入。 */
export const SETTING_KEYS = ['server', 'features', 'siteMeta', 'links'] as const;
export type SettingKey = (typeof SETTING_KEYS)[number];

export function isSettingKey(key: string): key is SettingKey {
  return (SETTING_KEYS as readonly string[]).includes(key);
}

/** 列出目前被後台覆寫（存在於 settings 表）的鍵。 */
export async function overriddenKeys(): Promise<SettingKey[]> {
  try {
    const rows = await db()<{ key: string }[]>`SELECT key FROM settings`;
    return rows.map((r) => r.key).filter(isSettingKey);
  } catch {
    return [];
  }
}

/**
 * 撤銷單一設定的後台覆寫 —— 刪除該列後 `readSetting` 會自動回退到
 * `DEFAULT_*` 常數，因此這就是「還原預設值」的實作。
 */
export async function resetSetting(key: SettingKey): Promise<boolean> {
  const rows = await db()<{ key: string }[]>`DELETE FROM settings WHERE key = ${key} RETURNING key`;
  return rows.length > 0;
}

/** 撤銷所有後台覆寫，全部還原為程式內建預設值。 */
export async function resetAllSettings(): Promise<number> {
  const rows = await db()<{ key: string }[]>`DELETE FROM settings RETURNING key`;
  return rows.length;
}
