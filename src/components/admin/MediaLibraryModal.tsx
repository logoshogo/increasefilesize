'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface MediaItem {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  alt: string | null;
  createdAt: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (item: MediaItem) => void;
}

export function MediaLibraryModal({ open, onClose, onSelect }: Props) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/media', { cache: 'no-store' });
      if (res.ok) {
        const data = (await res.json()) as { media: MediaItem[] };
        setItems(data.media);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  async function upload(file: File) {
    setError(null);
    setLoading(true);
    const form = new FormData();
    form.append('file', file);
    const res = await fetch('/api/admin/media', { method: 'POST', body: form });
    setLoading(false);
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? 'Upload failed.');
      return;
    }
    await load();
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Media library"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="font-semibold text-slate-900">Media library</h2>
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void upload(file);
                e.target.value = '';
              }}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Upload image
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600"
            >
              Close
            </button>
          </div>
        </header>

        {error && <p className="bg-rose-50 px-5 py-2 text-sm text-rose-800">{error}</p>}

        <div className="max-h-[65vh] overflow-y-auto p-5">
          {loading && items.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-500">Loading…</p>
          ) : items.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-500">
              No images yet. Upload one to get started.
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(item);
                      onClose();
                    }}
                    className="group block w-full overflow-hidden rounded-xl border border-slate-200 text-left transition hover:border-brand-400"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.url}
                      alt={item.alt ?? item.filename}
                      className="aspect-video w-full bg-slate-100 object-cover"
                    />
                    <span className="block truncate px-2 py-1.5 text-xs text-slate-500 group-hover:text-brand-700">
                      {item.filename}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
