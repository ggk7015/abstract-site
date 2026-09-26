'use client';

import { useState } from 'react';

export function CopyIp({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const el = document.createElement('textarea');
      el.value = value;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      el.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="group flex items-center gap-2 text-left text-bone transition-colors hover:text-acid"
      aria-label={`複製 ${value}`}
    >
      <span className="break-all">{value}</span>
      <span className="shrink-0 text-[0.625rem] uppercase tracking-widest text-ash-2 group-hover:text-acid">
        {copied ? '已複製' : '複製'}
      </span>
    </button>
  );
}
