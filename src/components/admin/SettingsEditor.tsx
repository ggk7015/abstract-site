'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { FeatureGroup, ServerInfo } from '@/lib/content';

type Payload = {
  server: ServerInfo;
  features: FeatureGroup[];
  siteMeta: Record<string, string>;
  links: Record<string, string>;
};

export function SettingsEditor({ server, features, siteMeta, links }: Payload) {
  const router = useRouter();
  const [form, setForm] = useState<Payload>({
    server: { ...server, modes: [...server.modes] },
    features: features.map((f) => ({ ...f, points: [...f.points] })),
    siteMeta: { ...siteMeta },
    links: { ...links },
  });
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const setServer = <K extends keyof ServerInfo>(key: K, value: ServerInfo[K]) =>
    setForm((f) => ({ ...f, server: { ...f.server, [key]: value } }));

  const setFeature = (index: number, key: keyof FeatureGroup, value: string | string[]) =>
    setForm((f) => ({ ...f, features: f.features.map((item, i) => (i === index ? { ...item, [key]: value } : item)) }));

  const save = async () => {
    setBusy(true);
    setMessage('');
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(form),
    });
    setBusy(false);
    setMessage(res.ok ? '已儲存，前台立即生效' : '儲存失敗');
    if (res.ok) router.refresh();
  };

  return (
    <div className="space-y-8">
      <section className="panel space-y-4 p-5">
        <h2 className="text-sm text-bone">伺服器資訊</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="IP" value={form.server.ip} onChange={(v) => setServer('ip', v)} />
          <Field label="連接埠" value={String(form.server.port)} onChange={(v) => setServer('port', Number(v) || 0)} type="number" />
          <Field label="遊戲版本" value={form.server.version} onChange={(v) => setServer('version', v)} />
          <Field label="核心" value={form.server.core} onChange={(v) => setServer('core', v)} />
          <Field label="支援客戶端" value={form.server.loader} onChange={(v) => setServer('loader', v)} />
          <Field label="最低 Java" value={form.server.java} onChange={(v) => setServer('java', v)} />
          <Field label="最大人數" value={String(form.server.slots)} onChange={(v) => setServer('slots', Number(v) || 0)} type="number" />
        </div>
        <label className="block">
          <span className="label">模式（用逗號分隔）</span>
          <input
            className="field mt-1"
            defaultValue={form.server.modes.join(', ')}
            onBlur={(e) => setServer('modes', e.target.value.split(/[,，]/).map((s) => s.trim()).filter(Boolean))}
          />
        </label>
      </section>

      <section className="panel space-y-4 p-5">
        <h2 className="text-sm text-bone">網站文案與連結</h2>
        <Field
          label="首頁簡介"
          value={form.siteMeta.about ?? ''}
          onChange={(v) => setForm((f) => ({ ...f, siteMeta: { ...f.siteMeta, about: v } }))}
        />
        {['discord', 'map', 'store', 'github'].map((key) => (
          <Field
            key={key}
            label={key}
            value={form.links[key] ?? ''}
            onChange={(v) => setForm((f) => ({ ...f, links: { ...f.links, [key]: v } }))}
          />
        ))}
      </section>

      <section className="panel space-y-6 p-5">
        <h2 className="text-sm text-bone">玩法列表（{form.features.length}）</h2>
        {form.features.map((f, i) => (
          <div key={f.id} className="space-y-3 border-t border-line pt-5 first:border-0 first:pt-0">
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="標題" value={f.title} onChange={(v) => setFeature(i, 'title', v)} />
              <Field label="識別碼" value={f.id} onChange={(v) => setFeature(i, 'id', v)} />
              <Field label="對應插件" value={f.plugin} onChange={(v) => setFeature(i, 'plugin', v)} />
            </div>
            <Field label="說明" value={f.blurb} onChange={(v) => setFeature(i, 'blurb', v)} />
            <Field
              label="條列（每行一項）"
              value={f.points.join('\n')}
              onChange={(v) => setFeature(i, 'points', v.split('\n').map((s) => s.trim()).filter(Boolean))}
              multiline
            />
          </div>
        ))}
      </section>

      <div className="flex items-center gap-4">
        <button type="button" onClick={save} disabled={busy} className="btn disabled:opacity-50">
          {busy ? '儲存中…' : '儲存全部設定'}
        </button>
        {message && <span className="font-mono text-xs text-ash-2">{message}</span>}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  multiline?: boolean;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {multiline ? (
        <textarea className="field mt-1 min-h-24 leading-relaxed" value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input type={type} className="field mt-1" value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  );
}
