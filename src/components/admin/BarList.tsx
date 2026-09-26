'use client';

export type Row = { label: string; pv: number; uv: number };

export function BarList({ rows, unit = 'PV' }: { rows: Row[]; unit?: string }) {
  if (rows.length === 0) {
    return <div className="border border-dashed border-line-2 p-6 text-center text-sm text-ash-2">尚無資料</div>;
  }
  const max = Math.max(...rows.map((r) => r.pv), 1);

  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="truncate text-sm text-bone">{r.label}</span>
            <span className="shrink-0 font-mono text-xs tabular-nums text-ash">
              {r.pv.toLocaleString()} <span className="text-ash-2">{unit}</span>
            </span>
          </div>
          <div className="mt-1.5 h-1.5 w-full bg-ink-3">
            <div className="h-full bg-acid" style={{ width: `${(r.pv / max) * 100}%` }} />
          </div>
          {r.uv > 0 && (
            <p className="mt-1 font-mono text-[0.625rem] text-ash-2">{r.uv.toLocaleString()} 位獨立訪客</p>
          )}
        </li>
      ))}
    </ul>
  );
}
