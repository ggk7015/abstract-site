'use client';

import { useState } from 'react';

type Props = {
  /** 按鈕文字。 */
  label: string;
  /** 撤銷目標的說明，會出現在確認列。 */
  subject: string;
  /**
   * 填入此字串則使用者必須輸入完全相同的文字才能執行。
   * 建議用於「全部刪除」等不可逆的批次操作。
   */
  confirmWord?: string;
  onConfirm: () => Promise<void> | void;
  disabled?: boolean;
  className?: string;
};

/**
 * 撤銷確認按鈕。
 *
 * 資訊安全需求：所有破壞性操作都必須經過這個元件二次確認，
 * 避免誤觸；高風險的批次刪除再額外要求輸入指定文字。
 */
export function ConfirmButton({
  label,
  subject,
  confirmWord,
  onConfirm,
  disabled,
  className = '',
}: Props) {
  const [armed, setArmed] = useState(false);
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);

  const ready = !confirmWord || typed.trim() === confirmWord;

  const run = async () => {
    if (!ready || busy) return;
    setBusy(true);
    try {
      await onConfirm();
      setArmed(false);
      setTyped('');
    } finally {
      setBusy(false);
    }
  };

  if (!armed) {
    return (
      <button
        type="button"
        onClick={() => setArmed(true)}
        disabled={disabled}
        className={`border border-line px-3 py-1.5 font-mono text-[0.625rem] uppercase text-ash transition-colors hover:border-blood hover:text-blood disabled:opacity-40 ${className}`}
      >
        {label}
      </button>
    );
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-2 border border-blood/60 bg-blood/5 px-2 py-1.5">
      <span className="font-mono text-[0.625rem] text-blood">撤銷 {subject}？</span>
      {confirmWord && (
        <input
          autoFocus
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder={confirmWord}
          aria-label={`輸入 ${confirmWord} 以確認`}
          className="field w-28 px-2 py-1 font-mono text-[0.625rem]"
        />
      )}
      <button
        type="button"
        onClick={run}
        disabled={!ready || busy}
        className="border border-blood px-2 py-1 font-mono text-[0.625rem] uppercase text-blood disabled:opacity-40"
      >
        {busy ? '執行中…' : '確定撤銷'}
      </button>
      <button
        type="button"
        onClick={() => {
          setArmed(false);
          setTyped('');
        }}
        className="border border-line px-2 py-1 font-mono text-[0.625rem] uppercase text-ash-2"
      >
        取消
      </button>
    </span>
  );
}

/** 破壞性操作區塊的共用外框。 */
export function DangerZone({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-blood/40 bg-blood/[0.03] p-5">
      <h2 className="font-mono text-xs uppercase tracking-[0.12em] text-blood">{title}</h2>
      {description && <p className="mt-2 max-w-prose text-xs leading-relaxed text-ash-2">{description}</p>}
      <div className="mt-4 flex flex-wrap items-center gap-3">{children}</div>
    </section>
  );
}
