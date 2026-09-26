'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CATEGORIES, type Announcement } from '@/lib/announcement-types';
import { ConfirmButton, DangerZone } from './ConfirmButton';

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
  const [selected, setSelected] = useState<string[]>([]);

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
    await fetch(`/api/admin/announcements/${id}`, { method: 'DELETE' });
    setItems((prev) => prev.filter((a) => a.id !== id));
    setSelected((prev) => prev.filter((s) => s !== id));
    refresh();
  };

  /** 批次撤銷：body 帶 ids 或 status，兩者皆由 API 驗證。 */
  const removeMany = async (body: Record<string, unknown>, label: string) => {
    setMessage('');
    const res = await fetch('/api/admin/announcements', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      setMessage(((await res.json()) as { error?: string }).error ?? '批次刪除失敗');
      return;
    }
    const { removed } = (await res.json()) as { removed: number };
    setItems((prev) =>
      body.ids
        ? prev.filter((a) => !(body.ids as string[]).includes(a.id))
        : prev.filter((a) => a.status !== body.status),
    );
    setSelected([]);
    setMessage(`${label}：已撤銷 ${removed} 則`);
    refresh();
  };

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));

  const countBy = (status: Announcement['status']) => items.filter((a) => a.status === status).length;

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
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-sm text-bone">已存在公告（{items.length}）</h2>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSelected(selected.length === items.length ? [] : items.map((a) => a.id))}
              className="border border-line px-3 py-1.5 font-mono text-[0.625rem] uppercase text-ash hover:text-bone"
            >
              {selected.length === items.length && items.length > 0 ? '取消全選' : '全選'}
            </button>
            {selected.length > 0 && (
              <ConfirmButton
                label={`撤銷選取的 ${selected.length} 則`}
                subject="選取的公告"
                confirmWord="批次刪除"
                onConfirm={() => removeMany({ ids: selected }, '批次刪除')}
              />
            )}
          </div>
        </div>

        {items.length === 0 ? (
          <p className="mt-4 border border-dashed border-line-2 p-6 text-center text-sm text-ash-2">還沒有公告</p>
        ) : (
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {items.map((a) => (
              <li key={a.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <label className="flex min-w-0 cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selected.includes(a.id)}
                    onChange={() => toggle(a.id)}
                    aria-label={`選取 ${a.title}`}
                    className="mt-1 h-4 w-4 shrink-0 accent-[#c6f432]"
                  />
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm text-bone">{a.title}</span>
                      {a.pinned && <span className="font-mono text-[0.5625rem] uppercase text-acid">置頂</span>}
                      <span
                        className={`font-mono text-[0.5625rem] uppercase ${
                          a.status === 'published' ? 'text-acid' : 'text-ash-2'
                        }`}
                      >
                        {STATUS_LABEL[a.status]}
                      </span>
                    </span>
                    <span className="mt-1 block font-mono text-[0.625rem] text-ash-2">
                      {CATEGORIES.find((c) => c.id === a.category)?.label} · {a.created_at.slice(0, 10)} · {a.author}
                    </span>
                  </span>
                </label>
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
                  <ConfirmButton label="刪除" subject="這則公告" onConfirm={() => remove(a.id)} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <DangerZone
        title="批次撤銷公告"
        description="依狀態一次撤銷多則公告，適合定期清理。已發布的公告被撤銷後前台會立即消失，無法復原。"
      >
        <ConfirmButton
          label={`撤銷全部草稿（${countBy('draft')}）`}
          subject="全部草稿"
          onConfirm={() => removeMany({ status: 'draft' }, '草稿清理')}
          disabled={countBy('draft') === 0}
        />
        <ConfirmButton
          label={`撤銷全部封存（${countBy('archived')}）`}
          subject="全部封存公告"
          onConfirm={() => removeMany({ status: 'archived' }, '封存清理')}
          disabled={countBy('archived') === 0}
        />
      </DangerZone>
    </div>
  );
}
