'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { MediaLibraryModal, type MediaItem } from '@/components/admin/MediaLibraryModal';
import { slugify } from '@/lib/sanitize';

// Tiptap touches the DOM on mount, so it is loaded client-side only.
const TiptapEditor = dynamic(
  () => import('@/components/admin/TiptapEditor').then((m) => m.TiptapEditor),
  { ssr: false, loading: () => <div className="h-[480px] animate-pulse rounded-xl bg-white" /> },
);

export interface ArticleDraft {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  ogImage: string;
  status: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED';
  publishedAt: string;
}

export function ArticleEditor({ initial }: { initial: ArticleDraft }) {
  const router = useRouter();
  const [draft, setDraft] = useState<ArticleDraft>(initial);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.slug));
  const [mediaOpen, setMediaOpen] = useState(false);
  const [mediaTarget, setMediaTarget] = useState<'content' | 'og'>('content');
  const [imageToInsert, setImageToInsert] = useState<{ url: string; alt?: string | null } | null>(null);
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  const set = useCallback(<K extends keyof ArticleDraft>(key: K, value: ArticleDraft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }, []);

  const onTitle = (title: string) => {
    setDraft((prev) => ({
      ...prev,
      title,
      slug: slugTouched ? prev.slug : slugify(title),
    }));
  };

  const onSelectMedia = (item: MediaItem) => {
    if (mediaTarget === 'og') set('ogImage', item.url);
    else setImageToInsert({ url: item.url, alt: item.alt });
  };

  const metaTitleLength = (draft.metaTitle || draft.title).length;
  const metaDescLength = (draft.metaDescription || draft.excerpt).length;

  const wordCount = useMemo(
    () => draft.content.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length,
    [draft.content],
  );

  async function save(nextStatus?: ArticleDraft['status']) {
    const status = nextStatus ?? draft.status;
    if (!draft.title.trim()) {
      setMessage({ tone: 'error', text: 'Give the article a title first.' });
      return;
    }
    if (status === 'SCHEDULED' && !draft.publishedAt) {
      setMessage({ tone: 'error', text: 'Pick a date and time to schedule this for.' });
      return;
    }

    setSaving(true);
    setMessage(null);

    const payload = {
      ...draft,
      status,
      publishedAt: draft.publishedAt ? new Date(draft.publishedAt).toISOString() : null,
    };

    const res = await fetch(
      draft.id ? `/api/admin/articles/${draft.id}` : '/api/admin/articles',
      {
        method: draft.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
    );

    setSaving(false);

    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setMessage({ tone: 'error', text: data.error ?? 'Could not save this article.' });
      return;
    }

    const data = (await res.json()) as { article: { id: string } };
    setDraft((prev) => ({ ...prev, id: data.article.id, status }));
    setMessage({ tone: 'ok', text: status === 'PUBLISHED' ? 'Published.' : 'Saved.' });

    if (!draft.id) router.replace(`/admin/articles/${data.article.id}/edit`);
    router.refresh();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {draft.id ? 'Edit article' : 'New article'}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setPreview((p) => !p)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400"
          >
            {preview ? 'Back to editor' : 'Live preview'}
          </button>
          <button
            type="button"
            onClick={() => void save('DRAFT')}
            disabled={saving}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 disabled:opacity-50"
          >
            Save draft
          </button>
          <button
            type="button"
            onClick={() => void save('PUBLISHED')}
            disabled={saving}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:bg-slate-300"
          >
            {saving ? 'Saving…' : 'Publish'}
          </button>
        </div>
      </div>

      {message && (
        <p
          role="status"
          className={`mt-4 rounded-lg px-4 py-2.5 text-sm ${
            message.tone === 'ok' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
          }`}
        >
          {message.text}
        </p>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main column */}
        <div className="space-y-4">
          <input
            value={draft.title}
            onChange={(e) => onTitle(e.target.value)}
            placeholder="Article title"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-xl font-semibold text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />

          {preview ? (
            <article className="rounded-xl border border-slate-200 bg-white px-6 py-6">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                {draft.title || 'Untitled'}
              </h1>
              <div
                className="prose-article mt-6"
                dangerouslySetInnerHTML={{ __html: draft.content }}
              />
            </article>
          ) : (
            <TiptapEditor
              value={initial.content}
              onChange={(html) => set('content', html)}
              onRequestMedia={() => {
                setMediaTarget('content');
                setMediaOpen(true);
              }}
              imageToInsert={imageToInsert}
              onImageInserted={() => setImageToInsert(null)}
            />
          )}

          <p className="text-sm text-slate-500">{wordCount.toLocaleString()} words</p>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <Card title="Status">
            <div className="space-y-3">
              <select
                value={draft.status}
                onChange={(e) => set('status', e.target.value as ArticleDraft['status'])}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="SCHEDULED">Scheduled</option>
              </select>

              {draft.status === 'SCHEDULED' && (
                <div>
                  <label className="block text-xs font-medium text-slate-600">Publish at</label>
                  <input
                    type="datetime-local"
                    value={draft.publishedAt}
                    onChange={(e) => set('publishedAt', e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    It goes live automatically once this time passes.
                  </p>
                </div>
              )}
            </div>
          </Card>

          <Card title="SEO">
            <Field label="URL slug" hint={`/blog/${draft.slug || 'your-slug'}`}>
              <input
                value={draft.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  set('slug', e.target.value);
                }}
                onBlur={(e) => set('slug', slugify(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </Field>

            <Field
              label="Meta title"
              hint={`${metaTitleLength} characters${metaTitleLength > 60 ? ' — may be truncated in results' : ''}`}
            >
              <input
                value={draft.metaTitle}
                onChange={(e) => set('metaTitle', e.target.value)}
                placeholder={draft.title}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </Field>

            <Field
              label="Meta description"
              hint={`${metaDescLength} characters${metaDescLength > 160 ? ' — may be truncated' : ''}`}
            >
              <textarea
                value={draft.metaDescription}
                onChange={(e) => set('metaDescription', e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </Field>

            <Field label="Excerpt" hint="Shown on the blog index">
              <textarea
                value={draft.excerpt}
                onChange={(e) => set('excerpt', e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </Field>
          </Card>

          <Card title="Featured / OG image">
            {draft.ogImage ? (
              <div className="space-y-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={draft.ogImage}
                  alt=""
                  className="aspect-video w-full rounded-lg border border-slate-200 object-cover"
                />
                <button
                  type="button"
                  onClick={() => set('ogImage', '')}
                  className="text-xs font-medium text-rose-600 hover:underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMediaTarget('og');
                  setMediaOpen(true);
                }}
                className="w-full rounded-lg border border-dashed border-slate-300 px-3 py-6 text-sm text-slate-500 transition hover:border-brand-400 hover:text-brand-700"
              >
                Choose from media library
              </button>
            )}
          </Card>
        </aside>
      </div>

      <MediaLibraryModal open={mediaOpen} onClose={() => setMediaOpen(false)} onSelect={onSelectMedia} />
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
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
      {hint && <p className="mt-1 truncate text-xs text-slate-400">{hint}</p>}
    </div>
  );
}
