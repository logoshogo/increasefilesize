import Link from 'next/link';
import { LandingPageTemplate } from '@/components/site/LandingPageTemplate';
import { buildHubContent } from '@/lib/page-content';
import { TARGET_PAGES, FORMAT_LABEL } from '@/config/target-pages';

/** Shared renderer for /jpg, /png and /pdf. */
export function FormatHub({ format }: { format: 'jpg' | 'png' | 'pdf' }) {
  const page = buildHubContent(format);
  const pages = TARGET_PAGES.filter((p) => p.format === format);
  const universal = TARGET_PAGES.filter((p) => p.format === 'any' && p.targetBytes).slice(0, 6);

  return (
    <LandingPageTemplate page={page}>
      <section className="mt-12">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
          Every {FORMAT_LABEL[format]} target size
        </h2>
        <p className="mt-3 text-slate-600">
          Each page below loads the tool already set to that target, so you can go straight from opening
          it to downloading the file.
        </p>
        <ul className="mt-5 grid gap-2 sm:grid-cols-2">
          {pages.map((p) => (
            <li key={p.slug}>
              <Link
                href={`/${p.slug}`}
                className="block rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 transition hover:border-brand-300 hover:text-brand-700"
              >
                {p.keyword}
              </Link>
            </li>
          ))}
        </ul>

        <h3 className="mt-8 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Works with any file type
        </h3>
        <ul className="mt-3 flex flex-wrap gap-2">
          {universal.map((p) => (
            <li key={p.slug}>
              <Link
                href={`/${p.slug}`}
                className="inline-block rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 transition hover:border-brand-400 hover:text-brand-700"
              >
                {p.targetLabel}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </LandingPageTemplate>
  );
}
