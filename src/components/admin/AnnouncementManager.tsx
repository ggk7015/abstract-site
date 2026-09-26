'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CATEGORIES, type Announcement } from '@/lib/announcement-types';

const STATUS_LABEL: Record<string, string> = {
  draft: '草稿',
  published: '已發布',
  archived: '封存',
};

const BLANK = {
  title: '',
  body: '',
  category: 'notice',
  pinned: false,
  status: 'draft' as Announcement['status'],
  starts_at: '',
  ends_at: '',
};

export function AnnouncementManager({ initial }: { initial: Announcement[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [form, setForm] = useState({ ...BLANK });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const refresh = () => router.refresh();

  const reset = () => {
    setForm({ ...BLANK });
    setEditingId(null);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    const payload = { ...form, starts_at: form.starts_at || null, ends_at: form.ends_at || null };
    const res = await fetch(
      editingId ? `/api/admin/announcements/${editingId}` : '/api/admin/announcements',
      {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      },
    );
    setBusy(false);
    if (!res.ok) {
      setMessage(((await res.json()) as { error?: string }).error ?? '儲存失敗');
      return;
    }
    const json = (await res.json()) as { announcement: Announcement };
    setItems((prev) =>
      editingId ? prev.map((a) => (a.id === json.announcement.id ? json.announcement : a)) : [json.announcement, ...prev],
    );
    setMessage('已儲存');
    reset();
    refresh();
  };

  const remove = async (id: string) => {
    if (!confirm('確定要刪除這則公告？')) return;
    await fetch(`/api/admin/announcements/${id}`, { method: 'DELETE' });
    setItems((prev) => prev.filter((a) => a.id !== id));
    refresh();
  };

  const startEdit = (a: Announcement) => {
    setEditingId(a.id);
    setForm({
      title: a.title,
      body: a.body,
      category: a.category,
      pinned: a.pinned,
      status: a.status,
      starts_at: a.starts_at ? a.starts_at.slice(0, 16) : '',
      ends_at: a.ends_at ? a.ends_at.slice(0, 16) : '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-8">
      <form onSubmit={submit} className="panel space-y-4 p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm text-bone">{editingId ? '編輯公告' : '新增公告'}</h2>
          {editingId && (
            <button type="button" onClick={reset} className="font-mono text-[0.625rem] text-ash-2 hover:text-blood">
              取消編輯
            </button>
          )}
        </div>

        <label className="block">
          <span className="label">標題</span>
          <input className="field mt-1" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        </label>

        <label className="block">
          <span className="label">內容</span>
          <textarea
            className="field mt-1 min-h-40 leading-relaxed"
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="label">分類</span>
            <select className="field mt-1" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="label">狀態</span>
            <select
              className="field mt-1"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as Announcement['status'] })}
            >
              {Object.entries(STATUS_LABEL).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-end gap-2 pb-2">
            <input
              type="checkbox"
              checked={form.pinned}
              onChange={(e) => setForm({ ...form, pinned: e.target.checked })}
              className="h-4 w-4 accent-[#c6f432]"
            />
            <span className="label">置頂顯示</span>
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="label">開始時間（可留空）</span>
            <input
              type="datetime-local"
              className="field mt-1"
              value={form.starts_at}
              onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="label">結束時間（可留空）</span>
            <input
              type="datetime-local"
              className="field mt-1"
              value={form.ends_at}
              onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
            />
          </label>
        </div>

        <div className="flex items-center gap-4">
          <button type="submit" disabled={busy} className="btn disabled:opacity-50">
            {busy ? '儲存中…' : editingId ? '更新公告' : '建立公告'}
          </button>
          {message && <span className="font-mono text-xs text-ash-2">{message}</span>}
        </div>
      </form>

      <section>
        <h2 className="text-sm text-bone">已存在公告（{items.length}）</h2>
        {items.length === 0 ? (
          <p className="mt-4 border border-dashed border-line-2 p-6 text-center text-sm text-ash-2">還沒有公告</p>
        ) : (
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {items.map((a) => (
              <li key={a.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm text-bone">{a.title}</span>
                    {a.pinned && <span className="font-mono text-[0.5625rem] uppercase text-acid">置頂</span>}
                    <span
                      className={`font-mono text-[0.5625rem] uppercase ${
                        a.status === 'published' ? 'text-acid' : 'text-ash-2'
                      }`}
                    >
                      {STATUS_LABEL[a.status]}
                    </span>
                  </p>
                  <p className="mt-1 font-mono text-[0.625rem] text-ash-2">
                    {CATEGORIES.find((c) => c.id === a.category)?.label} · {a.created_at.slice(0, 10)} · {a.author}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <a
                    href={`/announcements/${a.slug}`}
                    target="_blank"
                    className="border border-line px-3 py-1.5 font-mono text-[0.625rem] uppercase text-ash hover:text-bone"
                  >
                    檢視
                  </a>
                  <button
                    type="button"
                    onClick={() => startEdit(a)}
                    className="border border-line px-3 py-1.5 font-mono text-[0.625rem] uppercase text-ash hover:text-acid"
                  >
                    編輯
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(a.id)}
                    className="border border-line px-3 py-1.5 font-mono text-[0.625rem] uppercase text-ash hover:border-blood hover:text-blood"
                  >
                    刪除
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
