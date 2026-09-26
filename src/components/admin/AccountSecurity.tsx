'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { ConfirmButton, DangerZone } from './ConfirmButton';
import { MIN_PASSWORD_LENGTH } from '@/lib/session-policy';

type Session = { id: string; current: boolean; createdAt: string; expiresAt: string };

export function AccountSecurity() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/sessions', { cache: 'no-store' });
    if (!res.ok) {
      setError(((await res.json()) as { error?: string }).error ?? '載入失敗');
      return;
    }
    setSessions(((await res.json()) as { sessions: Session[] }).sessions);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const revoke = async (body: Record<string, unknown>, label: string) => {
    setNotice('');
    const res = await fetch('/api/admin/sessions', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      setNotice(((await res.json()) as { error?: string }).error ?? '撤銷失敗');
      return;
    }
    const { removed } = (await res.json()) as { removed: number };
    setNotice(`${label}：已撤銷 ${removed} 個 session`);
    await load();
  };

  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (next !== confirmPw) {
      setError('兩次輸入的新密碼不一致');
      return;
    }
    if (next.length < MIN_PASSWORD_LENGTH) {
      setError(`新密碼至少需要 ${MIN_PASSWORD_LENGTH} 個字元`);
      return;
    }
    setSaving(true);
    const res = await fetch('/api/admin/password', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ current, next }),
    });
    setSaving(false);
    if (!res.ok) {
      setError(((await res.json()) as { error?: string }).error ?? '變更失敗');
      return;
    }
    // 密碼變更會撤銷所有 session，必須重新登入。
    router.push('/admin/login?changed=1');
    router.refresh();
  };

  const others = sessions.filter((s) => !s.current).length;

  return (
    <div className="space-y-8">
      <section className="panel p-5">
        <h2 className="text-sm text-bone">有效登入（{sessions.length}）</h2>
        <p className="mt-2 text-xs leading-relaxed text-ash-2">
          每個 session 代表一個已登入的裝置。若發現不认识的項目，直接撤銷即可立即失效。
        </p>

        {sessions.length === 0 ? (
          <p className="mt-4 border border-dashed border-line-2 p-6 text-center text-sm text-ash-2">
            {error || '查無有效 session'}
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {sessions.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="flex flex-wrap items-center gap-2">
                    <code className="font-mono text-xs text-bone">{s.id}…</code>
                    {s.current && <span className="font-mono text-[0.5625rem] uppercase text-acid">目前裝置</span>}
                  </p>
                  <p className="mt-1 font-mono text-[0.625rem] text-ash-2">
                    登入於 {new Date(s.createdAt).toLocaleString('zh-TW', { hour12: false })} · 有效至{' '}
                    {new Date(s.expiresAt).toLocaleString('zh-TW', { hour12: false })}
                  </p>
                </div>
                {!s.current && (
                  <ConfirmButton label="撤銷" subject="這個 session" onConfirm={() => revoke({ id: s.id }, '單一撤銷')} />
                )}
              </li>
            ))}
          </ul>
        )}

        {notice && <p className="mt-3 font-mono text-xs text-ash-2">{notice}</p>}
      </section>

      <DangerZone
        title="批次撤銷登入"
        description="一次撤銷所有非目前裝置的 session。若懷疑帳號外流，建議先執行此項，再更換密碼。"
      >
        <ConfirmButton
          label={`撤銷其他所有裝置（${others}）`}
          subject="其他所有 session"
          confirmWord="全部撤銷"
          onConfirm={() => revoke({}, '批次撤銷')}
          disabled={others === 0}
        />
      </DangerZone>

      <form onSubmit={changePassword} className="panel space-y-4 p-5">
        <div>
          <h2 className="text-sm text-bone">變更密碼</h2>
          <p className="mt-2 text-xs leading-relaxed text-ash-2">
            需要至少 {MIN_PASSWORD_LENGTH} 個字元。變更成功後<strong className="text-ash">所有裝置都會被登出</strong>
            ，包含這個瀏覽器，必須重新登入。
          </p>
        </div>

        <label className="block">
          <span className="label">目前密碼</span>
          <input
            type="password"
            autoComplete="current-password"
            className="field mt-1"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            required
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="label">新密碼</span>
            <input
              type="password"
              autoComplete="new-password"
              className="field mt-1"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              required
              minLength={MIN_PASSWORD_LENGTH}
            />
          </label>
          <label className="block">
            <span className="label">確認新密碼</span>
            <input
              type="password"
              autoComplete="new-password"
              className="field mt-1"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              required
              minLength={MIN_PASSWORD_LENGTH}
            />
          </label>
        </div>

        <div className="flex items-center gap-4">
          <button type="submit" disabled={saving} className="btn disabled:opacity-50">
            {saving ? '變更中…' : '變更密碼'}
          </button>
          {error && <span className="font-mono text-xs text-blood">{error}</span>}
        </div>
      </form>
    </div>
  );
}
