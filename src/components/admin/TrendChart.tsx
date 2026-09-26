'use client';

export type Series = { day: string; pv: number; uv: number };

function path(points: [number, number][]): string {
  return points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
}

export function TrendChart({ data }: { data: Series[] }) {
  const W = 720;
  const H = 200;
  const PAD = 8;

  if (data.length === 0) return <Empty />;

  const max = Math.max(1, ...data.map((d) => Math.max(d.pv, d.uv)));
  const stepX = data.length > 1 ? (W - PAD * 2) / (data.length - 1) : 0;
  const y = (v: number) => H - PAD - (v / max) * (H - PAD * 2);

  const pv = data.map((d, i) => [PAD + i * stepX, y(d.pv)] as [number, number]);
  const uv = data.map((d, i) => [PAD + i * stepX, y(d.uv)] as [number, number]);
  const area = `${path(pv)} L${pv[pv.length - 1][0]},${H} L${pv[0][0]},${H} Z`;

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="瀏覽量趨勢圖">
        <defs>
          <linearGradient id="pvFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c6f432" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#c6f432" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75, 1].map((r) => (
          <line key={r} x1={0} x2={W} y1={H * r} y2={H * r} stroke="#26262f" strokeWidth={1} />
        ))}
        <path d={area} fill="url(#pvFill)" />
        <path d={path(uv)} fill="none" stroke="#4d8dff" strokeWidth={1.5} strokeDasharray="4 3" />
        <path d={path(pv)} fill="none" stroke="#c6f432" strokeWidth={2} />
      </svg>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <Legend color="#c6f432" label="瀏覽量 PV" />
        <Legend color="#4d8dff" label="獨立訪客 UV" dashed />
        <span className="font-mono text-[0.625rem] text-ash-2">
          {data[0].day} → {data[data.length - 1].day} · 峰值 {max}
        </span>
      </div>
    </div>
  );
}

function Legend({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <span className="flex items-center gap-2 font-mono text-[0.625rem] uppercase tracking-wider text-ash-2">
      <span
        className="inline-block h-0.5 w-5"
        style={{ background: dashed ? 'transparent' : color, borderTop: `2px ${dashed ? 'dashed' : 'solid'} ${color}` }}
      />
      {label}
    </span>
  );
}

function Empty() {
  return <div className="grid h-48 place-items-center border border-dashed border-line-2 text-sm text-ash-2">尚無資料</div>;
}
