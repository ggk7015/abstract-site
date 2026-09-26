'use client';

export function StatCard({
  label,
  value,
  delta,
  hint,
}: {
  label: string;
  value: string;
  delta?: number;
  hint?: string;
}) {
  const up = (delta ?? 0) >= 0;
  return (
    <div className="panel p-5">
      <p className="label">{label}</p>
      <p className="display mt-3 text-4xl tabular-nums">{value}</p>
      <div className="mt-3 flex items-center gap-3">
        {delta !== undefined && (
          <span
            className={`font-mono text-xs ${up ? 'text-acid' : 'text-blood'}`}
            title="與前一日相比"
          >
            {up ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}%
          </span>
        )}
        {hint && <span className="font-mono text-[0.625rem] text-ash-2">{hint}</span>}
      </div>
    </div>
  );
}
