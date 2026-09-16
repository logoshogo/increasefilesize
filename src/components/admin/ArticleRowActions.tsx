'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function ArticleRowActions({
  id,
  slug,
  status,
}: {
  id: string;
  slug: string;
  status: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  async function remove() {
    setBusy(true);
    await fetch(`/api/admin/articles/${id}`, { method: 'DELETE' });
    setBusy(false);
    setConfirming(false);
    router.refresh();
  }

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-2">
        <span className="text-xs text-slate-500">Delete?</span>
        <button
          type="button"
          onClick={remove}
          disabled={busy}
          className="rounded-md bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-rose-700 disabled:bg-rose-300"
        >
          {busy ? '…' : 'Yes'}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-600"
        >
          No
        </button>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-3 text-xs">
      {status === 'PUBLISHED' && (
        <Link href={`/blog/${slug}`} target="_blank" className="text-slate-500 hover:text-brand-700">
          View
        </Link>
      )}
      <Link href={`/admin/articles/${id}/edit`} className="font-medium text-brand-700 hover:underline">
        Edit
      </Link>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-rose-600 hover:underline"
      >
        Delete
      </button>
    </span>
  );
}
