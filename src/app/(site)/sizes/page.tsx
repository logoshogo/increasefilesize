import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllTargetPages } from '@/lib/target-pages';
import { FORMAT_LABEL, type PageFormat } from '@/config/target-pages';
import { formatBytes } from '@/lib/engines/bytes';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Every File Size Tool — JPG, PNG and PDF | increasefilesize.com',
  description:
    'The full index of file size tools on this site: exact KB and MB targets for JPG, PNG and PDF files, all free and all running in your browser.',
  alternates: { canonical: '/sizes' },
};

const GROUP_ORDER: PageFormat[] = ['any', 'jpg', 'png', 'pdf'];

const GROUP_BLURB: Record<PageFormat, string> = {
  any: 'These pages accept a JPG, PNG or PDF and set it to the size named.',
  jpg: 'JPG-specific pages. Padding goes into COM segments, so the photo is untouched.',
  png: 'PNG-specific pages, including resolution and quality variants.',
  pdf: 'PDF pages. Padding is an inert object that readers ignore.',
};

export default async function SizesIndexPage() {
  const pages = await getAllTargetPages();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
        Every file size tool on this site
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-slate-600">
        {pages.length} pages, each pre-set to one target size or format. They all use the same engine,
        run in your browser, and never upload your file.
      </p>

      {GROUP_ORDER.map((format) => {
        const group = pages
          .filter((p) => p.format === format)
          .sort((a, b) => (a.targetBytes ?? Number.MAX_SAFE_INTEGER) - (b.targetBytes ?? Number.MAX_SAFE_INTEGER));
        if (group.length === 0) return null;

        return (
          <section key={format} className="mt-10">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
              {format === 'any' ? 'Any file type' : FORMAT_LABEL[format]}
            </h2>
            <p className="mt-2 text-slate-600">{GROUP_BLURB[format]}</p>
            <ul className="mt-4 divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
              {group.map((p) => (
                <li key={p.slug}>
                  <Link
                    href={`/${p.slug}`}
                    className="flex items-center justify-between gap-4 px-4 py-3 transition hover:bg-slate-50"
                  >
                    <span className="text-slate-800">{p.keyword}</span>
                    <span className="shrink-0 text-sm text-slate-500">
                      {p.targetBytes ? formatBytes(p.targetBytes) : p.kind === 'informational' ? 'Guide' : 'Any size'}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
