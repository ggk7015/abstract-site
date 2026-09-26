'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    const data = new FormData(event.currentTarget);
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username: data.get('username'), password: data.get('password') }),
    });
    if (res.ok) {
      router.push('/admin');
      router.refresh();
      return;
    }
    setError(((await res.json()) as { error?: string }).error ?? '登入失敗');
    setBusy(false);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block">
        <span className="label">帳號</span>
        <input name="username" className="field mt-1" autoComplete="username" required />
      </label>
      <label className="block">
        <span className="label">密碼</span>
        <input name="password" type="password" className="field mt-1" autoComplete="current-password" required />
      </label>
      {error && <p className="font-mono text-xs text-blood">{error}</p>}
      <button type="submit" disabled={busy} className="btn w-full justify-center disabled:opacity-50">
        {busy ? '登入中…' : '登入'}
      </button>
    </form>
  );
}
