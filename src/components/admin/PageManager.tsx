'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

export interface ManagedPage {
  id: string | null;
  slug: string;
  format: 'jpg' | 'png' | 'pdf' | 'any';
  keyword: string;
  targetLabel: string | null;
  kind: 'tool' | 'informational';
  defaultMode: 'pad' | 'upscale';
  enabled: boolean;
  source: 'config' | 'database';
  views: number;
}

export function PageManager({ initial }: { initial: ManagedPage[] }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  const [form, setForm] = useState({
    format: 'any',
    targetSize: '',
    slug: '',
    keyword: '',
    defaultMode: 'pad',
    kind: 'tool',
    h1Override: '',
    introOverride: '',
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = q
      ? initial.filter((p) => p.slug.includes(q) || p.keyword.toLowerCase().includes(q))
      : initial;
    return [...rows].sort((a, b) => b.views - a.views || a.slug.localeCompare(b.slug));
  }, [initial, query]);

  const totalViews = initial.reduce((sum, p) => sum + p.views, 0);

  async function addPage(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    const res = await fetch('/api/admin/pages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    setSaving(false);

    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setMessage({ tone: 'error', text: data.error ?? 'Could not create that page.' });
      return;
    }

    const data = (await res.json()) as { page: { slug: string } };
    setMessage({ tone: 'ok', text: `Created /${data.page.slug}. It is live now.` });
    setAdding(false);
    setForm({ ...form, targetSize: '', slug: '', keyword: '', h1Override: '', introOverride: '' });
    router.refresh();
  }

  async function toggle(page: ManagedPage) {
    if (!page.id) {
      setMessage({
        tone: 'error',
        text: 'This page comes from the code config. Add a database override for it first, or edit src/config/target-pages.ts.',
      });
      return;
    }
    await fetch(`/api/admin/pages/${page.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: !page.enabled }),
    });
    router.refresh();
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Landing pages</h1>
          <p className="mt-1 text-sm text-slate-500">
            {initial.length} pages · {totalViews.toLocaleString()} views in the last 30 days
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAdding((a) => !a)}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          {adding ? 'Cancel' : 'Add a page'}
        </button>
      </div>

      {message && (
        <p
          className={`mt-4 rounded-lg px-4 py-2.5 text-sm ${
            message.tone === 'ok' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
          }`}
        >
          {message.text}
        </p>
      )}

      {adding && (
        <form
          onSubmit={addPage}
          className="mt-5 grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2"
        >
          <Field label="Format">
            <select
              value={form.format}
              onChange={(e) => setForm({ ...form, format: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="any">Any file type</option>
              <option value="jpg">JPG</option>
              <option value="png">PNG</option>
              <option value="pdf">PDF</option>
            </select>
          </Field>

          <Field label="Target size" hint='e.g. "120kb" or "3mb" — leave blank for a no-size page'>
            <input
              value={form.targetSize}
              onChange={(e) => setForm({ ...form, targetSize: e.target.value })}
              placeholder="100kb"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </Field>

          <Field label="URL slug" hint="Leave blank to generate it from the format and size">
            <input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="increase-jpg-file-size-to-120kb"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </Field>

          <Field label="Target keyword" hint="Used in copy and internal link anchors">
            <input
              value={form.keyword}
              onChange={(e) => setForm({ ...form, keyword: e.target.value })}
              placeholder="increase jpg file size to 120kb"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </Field>

          <Field label="Default tool mode">
            <select
              value={form.defaultMode}
              onChange={(e) => setForm({ ...form, defaultMode: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="pad">Pad file size</option>
              <option value="upscale">Increase resolution</option>
            </select>
          </Field>

          <Field label="Page type">
            <select
              value={form.kind}
              onChange={(e) => setForm({ ...form, kind: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="tool">Tool page</option>
              <option value="informational">Informational</option>
            </select>
          </Field>

          <Field label="H1 override" hint="Optional — the template generates one otherwise">
            <input
              value={form.h1Override}
              onChange={(e) => setForm({ ...form, h1Override: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </Field>

          <Field label="Intro override" hint="Optional — replaces the AEO answer paragraph">
            <textarea
              value={form.introOverride}
              onChange={(e) => setForm({ ...form, introOverride: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </Field>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:bg-brand-300"
            >
              {saving ? 'Creating…' : 'Create page'}
            </button>
          </div>
        </form>
      )}

      <div className="mt-6">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter by URL or keyword…"
          className="w-full max-w-sm rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3 font-medium">URL</th>
              <th className="px-5 py-3 font-medium">Target keyword</th>
              <th className="px-5 py-3 font-medium">Format</th>
              <th className="px-5 py-3 text-right font-medium">Views (30d)</th>
              <th className="px-5 py-3 text-right font-medium">Source</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((page) => (
              <tr key={page.slug} className={page.enabled ? '' : 'opacity-50'}>
                <td className="px-5 py-3">
                  <a
                    href={`/${page.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-slate-900 hover:text-brand-700"
                  >
                    /{page.slug}
                  </a>
                  {page.targetLabel && (
                    <span className="ml-2 text-xs text-slate-400">{page.targetLabel}</span>
                  )}
                </td>
                <td className="px-5 py-3 text-slate-600">{page.keyword}</td>
                <td className="px-5 py-3 uppercase text-slate-500">{page.format}</td>
                <td className="px-5 py-3 text-right tabular-nums text-slate-700">
                  {page.views.toLocaleString()}
                </td>
                <td className="px-5 py-3 text-right">
                  <span className="text-xs text-slate-400">{page.source}</span>
                  {page.source === 'database' && (
                    <button
                      type="button"
                      onClick={() => void toggle(page)}
                      className="ml-3 text-xs font-medium text-brand-700 hover:underline"
                    >
                      {page.enabled ? 'Disable' : 'Enable'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600">{label}</label>
      <div className="mt-1">{children}</div>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}
