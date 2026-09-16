'use client';

import { useState } from 'react';
import type { SiteSettings } from '@/lib/settings';

export function SettingsForm({ initial }: { initial: SiteSettings }) {
  const [values, setValues] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  const set = (key: keyof SiteSettings, value: string) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });

    setSaving(false);
    setMessage(
      res.ok
        ? { tone: 'ok', text: 'Settings saved. Public pages will pick these up on their next render.' }
        : { tone: 'error', text: 'Could not save these settings.' },
    );
  }

  return (
    <form onSubmit={save} className="max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Settings</h1>
      <p className="mt-1 text-sm text-slate-500">
        Site-wide defaults and verification tags. The built-in dashboard works without any of the
        third-party fields below.
      </p>

      {message && (
        <p
          className={`mt-4 rounded-lg px-4 py-2.5 text-sm ${
            message.tone === 'ok' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
          }`}
        >
          {message.text}
        </p>
      )}

      <section className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Meta defaults</h2>

        <Field label="Site name">
          <input
            value={values.siteName}
            onChange={(e) => set('siteName', e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </Field>

        <Field label="Default meta title" hint={`${values.defaultMetaTitle.length} characters`}>
          <input
            value={values.defaultMetaTitle}
            onChange={(e) => set('defaultMetaTitle', e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </Field>

        <Field
          label="Default meta description"
          hint={`${values.defaultMetaDescription.length} characters`}
        >
          <textarea
            value={values.defaultMetaDescription}
            onChange={(e) => set('defaultMetaDescription', e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </Field>
      </section>

      <section className="mt-5 space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Search console verification</h2>

        <Field
          label="Google site verification"
          hint='Just the content value of the meta tag, not the whole tag'
        >
          <input
            value={values.googleSiteVerification}
            onChange={(e) => set('googleSiteVerification', e.target.value)}
            placeholder="abc123..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm"
          />
        </Field>

        <Field label="Bing site verification">
          <input
            value={values.bingSiteVerification}
            onChange={(e) => set('bingSiteVerification', e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm"
          />
        </Field>
      </section>

      <section className="mt-5 space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Third-party analytics (optional)</h2>
        <p className="text-xs text-slate-500">
          These load in addition to the built-in stats. Leave them blank to ship no third-party
          scripts at all, which is the faster and more private default.
        </p>

        <Field label="Google Analytics measurement ID">
          <input
            value={values.googleAnalyticsId}
            onChange={(e) => set('googleAnalyticsId', e.target.value)}
            placeholder="G-XXXXXXXXXX"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm"
          />
        </Field>

        <Field label="Plausible domain">
          <input
            value={values.plausibleDomain}
            onChange={(e) => set('plausibleDomain', e.target.value)}
            placeholder="increasefilesize.com"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm"
          />
        </Field>
      </section>

      <button
        type="submit"
        disabled={saving}
        className="mt-6 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:bg-slate-300"
      >
        {saving ? 'Saving…' : 'Save settings'}
      </button>
    </form>
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
