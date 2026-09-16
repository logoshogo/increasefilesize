'use client';

import { useCallback, useRef, useState } from 'react';
import type { MediaItem } from '@/components/admin/MediaLibraryModal';
import { formatBytes } from '@/lib/engines/bytes';

export function MediaManager({ initial }: { initial: MediaItem[] }) {
  const [items, setItems] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const reload = useCallback(async () => {
    const res = await fetch('/api/admin/media', { cache: 'no-store' });
    if (res.ok) setItems(((await res.json()) as { media: MediaItem[] }).media);
  }, []);

  async function upload(files: FileList) {
    setBusy(true);
    setMessage(null);
    for (const file of Array.from(files)) {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/admin/media', { method: 'POST', body: form });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setMessage({ tone: 'error', text: `${file.name}: ${data.error ?? 'upload failed'}` });
      }
    }
    await reload();
    setBusy(false);
  }

  async function remove(item: MediaItem, force = false) {
    const res = await fetch(`/api/admin/media/${item.id}${force ? '?force=1' : ''}`, {
      method: 'DELETE',
    });
    if (res.status === 409) {
      const data = (await res.json()) as { error: string };
      if (window.confirm(`${data.error} Delete it anyway?`)) return remove(item, true);
      return;
    }
    await reload();
    setMessage({ tone: 'ok', text: `Deleted ${item.filename}.` });
  }

  async function copy(url: string) {
    const absolute = new URL(url, window.location.origin).toString();
    try {
      await navigator.clipboard.writeText(absolute);
      setCopied(url);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setMessage({ tone: 'error', text: 'Your browser blocked clipboard access.' });
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Media</h1>
          <p className="mt-1 text-sm text-slate-500">
            {items.length} image{items.length === 1 ? '' : 's'} · blog content only
          </p>
        </div>
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(e) => {
              if (e.target.files?.length) void upload(e.target.files);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:bg-slate-300"
          >
            {busy ? 'Uploading…' : 'Upload images'}
          </button>
        </div>
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

      {items.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-slate-200 bg-white px-5 py-16 text-center text-sm text-slate-500">
          No images uploaded yet.
        </p>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <li
              key={item.id}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.url}
                alt={item.alt ?? item.filename}
                className="aspect-video w-full bg-slate-100 object-cover"
              />
              <div className="px-3 py-2.5">
                <p className="truncate text-sm font-medium text-slate-800" title={item.filename}>
                  {item.filename}
                </p>
                <p className="text-xs text-slate-400">{formatBytes(item.size)}</p>
                <div className="mt-2 flex items-center gap-3 text-xs">
                  <button
                    type="button"
                    onClick={() => void copy(item.url)}
                    className="font-medium text-brand-700 hover:underline"
                  >
                    {copied === item.url ? 'Copied' : 'Copy URL'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void remove(item)}
                    className="text-rose-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
