'use client';

export type HeatCell = { weekday: number; hour: number; count: number };

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

export function ActivityHeatmap({ cells }: { cells: HeatCell[] }) {
  const lookup = new Map(cells.map((c) => [`${c.weekday}-${c.hour}`, c.count]));
  const max = Math.max(1, ...cells.map((c) => c.count));

  const shade = (count: number) => {
    if (count === 0) return '#16161c';
    const ratio = count / max;
    const alpha = 0.15 + ratio * 0.85;
    return `rgba(198, 244, 50, ${alpha.toFixed(3)})`;
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[560px]">
        <div className="flex gap-1 pl-8">
          {Array.from({ length: 24 }, (_, h) => (
            <span key={h} className="flex-1 text-center font-mono text-[0.5625rem] text-ash-2">
              {h % 3 === 0 ? h : ''}
            </span>
          ))}
        </div>
        <div className="mt-2 space-y-1">
          {WEEKDAYS.map((label, weekday) => (
            <div key={label} className="flex items-center gap-1">
              <span className="w-7 shrink-0 font-mono text-[0.625rem] text-ash-2">{label}</span>
              {Array.from({ length: 24 }, (_, hour) => {
                const count = lookup.get(`${weekday}-${hour}`) ?? 0;
                return (
                  <span
                    key={hour}
                    title={`週${label} ${hour}:00 — ${count} 次瀏覽`}
                    className="h-4 flex-1"
                    style={{ background: shade(count) }}
                  />
                );
              })}
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2 font-mono text-[0.625rem] text-ash-2">
          <span>低</span>
          {[0, 0.2, 0.45, 0.7, 1].map((r) => (
            <span key={r} className="h-3 w-5" style={{ background: shade(r * max) }} />
          ))}
          <span>高</span>
        </div>
      </div>
    </div>
  );
}
