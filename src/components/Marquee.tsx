'use client';

export function Marquee({ items }: { items: string[] }) {
  const doubled = [...items, ...items];
  return (
    <div className="overflow-hidden" aria-hidden>
      <div className="marquee flex w-max gap-8 whitespace-nowrap">
        {doubled.map((item, i) => (
          <span key={i} className="font-mono text-xs uppercase tracking-[0.2em]">
            {item} <span className="ml-8 opacity-40">◆</span>
          </span>
        ))}
      </div>
    </div>
  );
}
