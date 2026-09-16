import type { Metadata } from 'next';
import Link from 'next/link';
import { FileSizeTool } from '@/components/tool/FileSizeTool';
import { PrivacyNote } from '@/components/site/LandingPageTemplate';
import { TARGET_PAGES, FORMAT_HUBS, FORMAT_LABEL } from '@/config/target-pages';
import { BLOG_SEEDS } from '@/config/blog-seed';
import { buildPageContent } from '@/lib/page-content';
import { faqSchema, howToSchema, jsonLd, softwareApplicationSchema } from '@/lib/schema';

const homeConfig = {
  slug: '',
  format: 'any' as const,
  keyword: 'increase file size online',
  kind: 'tool' as const,
  h1Override: 'Increase File Size Online — Free, Exact, Nothing Uploaded',
  introOverride:
    'This free tool increases a JPG, PNG or PDF to an exact file size — 20KB, 100KB, 2MB or any figure you type — by padding it with data that decoders ignore, so the file looks exactly the same. Everything happens in your browser, and your file is never uploaded to a server.',
};

export const metadata: Metadata = {
  title: 'Increase File Size Online Free — JPG, PNG and PDF | increasefilesize.com',
  description:
    'Increase a JPG, PNG or PDF to an exact KB or MB size in seconds — free, no signup, works in your browser, nothing uploaded.',
  alternates: { canonical: '/' },
};

export default function HomePage() {
  const page = buildPageContent(homeConfig);
  const universal = TARGET_PAGES.filter((p) => p.format === 'any' && p.targetBytes);
  const jpg = TARGET_PAGES.filter((p) => p.format === 'jpg');
  const pdf = TARGET_PAGES.filter((p) => p.format === 'pdf');
  const png = TARGET_PAGES.filter((p) => p.format === 'png');

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(softwareApplicationSchema(page)) }}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(faqSchema(page)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(howToSchema(page)) }} />

      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Increase File Size Online — Free, Exact, Nothing Uploaded
        </h1>
        <p className="mt-5 border-l-4 border-brand-500 bg-white py-3 pl-5 pr-4 text-lg leading-relaxed text-slate-700 shadow-sm">
          {page.answer}
        </p>

        <div className="mt-8">
          <FileSizeTool format="any" heading="Increase any file to an exact size" />
        </div>

        <section className="mt-10 grid gap-3 sm:grid-cols-3">
          {FORMAT_HUBS.map((hub) => (
            <Link
              key={hub.slug}
              href={`/${hub.slug}`}
              className="rounded-xl border border-slate-200 bg-white px-4 py-4 transition hover:border-brand-300 hover:shadow-sm"
            >
              <span className="block font-semibold text-slate-900">
                Increase {FORMAT_LABEL[hub.format]} file size
              </span>
              <span className="mt-1 block text-sm text-slate-500">
                {hub.format === 'pdf'
                  ? 'Pad a PDF to 100KB, 200KB or any target'
                  : hub.format === 'jpg'
                    ? 'Exact targets from 20KB to 200KB'
                    : 'Pad, upscale or expand a PNG'}
              </span>
            </Link>
          ))}
        </section>

        <section id="how-it-works" className="mt-12">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">How it works</h2>
          <ol className="mt-5 space-y-4">
            {page.steps.map((step, i) => (
              <li key={step.name} className="flex gap-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
                  {i + 1}
                </span>
                <div>
                  <p className="font-medium text-slate-900">{step.name}</p>
                  <p className="mt-1 leading-relaxed text-slate-600">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            What the tool actually does to your file
          </h2>
          <p className="mt-4 leading-relaxed text-slate-600">
            A JPG is padded with COM comment segments, a PNG with ancillary tEXt chunks, and a PDF with an
            inert stream object. Each of those is a part of the format that its own specification tells
            readers to skip, which is why the output opens normally everywhere and looks identical to the
            original — the compressed image data is never decoded or rewritten.
          </p>
          <p className="mt-4 leading-relaxed text-slate-600">
            If you want a genuinely larger image rather than a larger file, switch the tool to “increase
            resolution”. That redraws the image at more pixels using the Canvas API and then pads the
            result to your exact target, so you get both a real resolution increase and the byte count the
            form is asking for.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Pick your exact size</h2>
          <p className="mt-3 text-slate-600">
            Each of these pages loads the tool pre-set to that target, with the details specific to it.
          </p>

          <LinkGroup title="Any file type" pages={universal} />
          <LinkGroup title="JPG" pages={jpg} />
          <LinkGroup title="PNG" pages={png} />
          <LinkGroup title="PDF" pages={pdf} />
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            Frequently asked questions
          </h2>
          <div className="mt-5 divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
            {page.faqs.map((faq) => (
              <details key={faq.question} className="group px-5 py-4">
                <summary className="cursor-pointer list-none font-medium text-slate-900">
                  <span className="flex items-start justify-between gap-4">
                    {faq.question}
                    <span aria-hidden className="mt-0.5 shrink-0 text-slate-500 transition group-open:rotate-45">
                      +
                    </span>
                  </span>
                </summary>
                <p className="mt-3 leading-relaxed text-slate-600">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">From the blog</h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {BLOG_SEEDS.slice(0, 4).map((article) => (
              <li key={article.slug}>
                <Link
                  href={`/blog/${article.slug}`}
                  className="block h-full rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:border-brand-300 hover:shadow-sm"
                >
                  <span className="block font-medium text-slate-900">{article.title}</span>
                  <span className="mt-1 block text-sm text-slate-500">{article.excerpt}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <PrivacyNote />
      </div>
    </>
  );
}

function LinkGroup({ title, pages }: { title: string; pages: { slug: string; keyword: string }[] }) {
  return (
    <div className="mt-6">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
      <ul className="mt-3 flex flex-wrap gap-2">
        {pages.map((p) => (
          <li key={p.slug}>
            <Link
              href={`/${p.slug}`}
              className="inline-block rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 transition hover:border-brand-400 hover:text-brand-700"
            >
              {p.keyword}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
