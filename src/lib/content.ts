export const SITE = {
  name: '抽象',
  nameEn: 'ABSTRACT',
  tagline: '簽到、稱號、經濟、小遊戲，一個不太抽象的生存服',
  domain: process.env.NEXT_PUBLIC_SITE_URL || 'https://abstract.pmcs.life',
  repo: 'https://github.com/ggk7015',
  discordInvite: process.env.NEXT_PUBLIC_DISCORD_INVITE || 'https://discord.gg/PgHdMYSxD',
  discordGuildId: '1490984957269770280',
  discordChannelName: '聊天同步',
  founded: '2026-04-07',
} as const;

export type ServerInfo = {
  ip: string;
  port: number;
  version: string;
  core: string;
  loader: string;
  java: string;
  modes: string[];
  slots: number;
};

export type FeatureGroup = {
  id: string;
  title: string;
  plugin: string;
  blurb: string;
  points: string[];
};

export const DEFAULT_SERVER: ServerInfo = {
  ip: 'abstract.pmcs.life',
  port: 25565,
  version: '26.2',
  core: 'Purpur (Paper)',
  loader: '支援 Fabric / NeoForge / Vanilla',
  java: 'Java 21+',
  modes: ['生存', '小遊戲', '領地', '玩家市場'],
  slots: 300,
};

export const DEFAULT_FEATURES: FeatureGroup[] = [
  {
    id: 'checkin',
    title: '每日簽到',
    plugin: '抽象簽到 v1.9.0.2',
    blurb: '點一下就完成，累積積分換獎勵。',
    points: ['遊戲內點擊式簽到介面', '累積天數與積分統計', '漏簽補簽機制'],
  },
  {
    id: 'title',
    title: '身分稱號',
    plugin: 'PlayerTitle 5.2.0-free',
    blurb: '名字上方的稱號，靠活動與戰績解鎖。',
    points: ['自訂稱號展示於頭頂', 'Discord 身分組連動', '稱號稀有度分級'],
  },
  {
    id: 'economy',
    title: '經濟與市場',
    plugin: 'BankPlus / GlobalMarketPlus',
    blurb: '玩家間自由交易，價格由市場決定。',
    points: ['銀行儲蓄與利息', '玩家擺攤市場', '交易手續費與稅率'],
  },
  {
    id: 'minigame',
    title: '抽象小遊戲',
    plugin: '［抽象小遊戲］v1.1.0',
    blurb: '伺服器內建猜謎小遊戲，答對拿獎勵。',
    points: ['即時回合制小遊戲', '排行榜計分 (15 - 7)', '每週獎勵結算'],
  },
  {
    id: 'claim',
    title: '領地與申訴',
    plugin: 'Claims / IgnoreClaims',
    blurb: '保護你的建築，被破壞可以申訴。',
    points: ['一鍵圈地保護', '違規舉報流程 (條款 C)', '/IgnoreClaims 忽略違規'],
  },
  {
    id: 'afk',
    title: '掛機區',
    plugin: 'AxAFKZone 1.10.1',
    blurb: '不想被打擾就進掛機區。',
    points: ['獨立 AFK 區域', '離開自動返回', '不計入在線統計'],
  },
  {
    id: 'perf',
    title: '效能優化',
    plugin: 'LagFixer / FAWE / ModernFix',
    blurb: 'TPS 穩定，世界的編輯工具齊全。',
    points: ['LagFixer 降低卡頓', 'FastAsyncWorldEdit 批次編輯', '客戶端 ModernFix 協同'],
  },
  {
    id: 'ui',
    title: '選單與資源包',
    plugin: 'CustomScreenMenu / ResourcePackManager',
    blurb: '自訂選單介面，資源包一鍵更新。',
    points: ['繁體中文自訂選單', '資源包自動推送', '遊戲內音樂 (GMusic)'],
  },
];

export const DEFAULT_STATS = [
  { value: '192', label: 'Discord 成員' },
  { value: '26.2', label: '遊戲版本' },
  { value: '60', label: '同時在線' },
  { value: '24/7', label: '全年無休' },
];
