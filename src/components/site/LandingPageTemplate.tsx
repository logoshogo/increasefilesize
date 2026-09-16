import Link from 'next/link';
import { FileSizeTool } from '@/components/tool/FileSizeTool';
import type { PageContent } from '@/lib/page-content';
import {
  breadcrumbSchema,
  faqSchema,
  howToSchema,
  jsonLd,
  softwareApplicationSchema,
} from '@/lib/schema';

interface Props {
  page: PageContent;
  /** Extra blocks rendered under the FAQ (used by the hubs). */
  children?: React.ReactNode;
}

export function LandingPageTemplate({ page, children }: Props) {
  const path = page.slug === '' ? '/' : `/${page.slug}`;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(softwareApplicationSchema(page)) }}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(faqSchema(page)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(howToSchema(page)) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            breadcrumbSchema([
              { name: 'Home', path: '/' },
              { name: page.h1, path },
            ]),
          ),
        }}
      />

      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <nav aria-label="Breadcrumb" className="mb-4 text-sm text-slate-500">
          <Link href="/" className="hover:text-brand-700">
            Home
          </Link>
          <span className="mx-2" aria-hidden>
            /
          </span>
          <span className="text-slate-700">{page.targetLabel ?? page.keyword}</span>
        </nav>

        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{page.h1}</h1>

        {/* AEO direct-answer block */}
        <p className="mt-5 border-l-4 border-brand-500 bg-white py-3 pl-5 pr-4 text-lg leading-relaxed text-slate-700 shadow-sm">
          {page.answer}
        </p>

        <div className="mt-8">
          <FileSizeTool
            format={page.format}
            initialTargetBytes={page.targetBytes}
            initialMode={page.defaultMode}
          />
        </div>

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
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">{page.whyHeading}</h2>
          {page.why.map((paragraph) => (
            <p key={paragraph.slice(0, 40)} className="mt-4 leading-relaxed text-slate-600">
              {paragraph}
            </p>
          ))}
        </section>

        {page.extraSections?.map((section) => (
          <section key={section.heading} className="mt-12">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">{section.heading}</h2>
            {section.body.map((paragraph) => (
              <p key={paragraph.slice(0, 40)} className="mt-4 leading-relaxed text-slate-600">
                {paragraph}
              </p>
            ))}
          </section>
        ))}

        <section className="mt-12">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            Frequently asked questions
          </h2>
          <div className="mt-5 divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
            {page.faqs.map((faq) => (
              <details key={faq.question} className="group px-5 py-4">
                <summary className="cursor-pointer list-none font-medium text-slate-900 marker:hidden">
                  <span className="flex items-start justify-between gap-4">
                    {faq.question}
                    <span
                      aria-hidden
                      className="mt-0.5 shrink-0 text-slate-500 transition group-open:rotate-45"
                    >
                      +
                    </span>
                  </span>
                </summary>
                <p className="mt-3 leading-relaxed text-slate-600">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        {children}

        <section className="mt-12">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Related tools and reading</h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {page.related.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block h-full rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:border-brand-300 hover:shadow-sm"
                >
                  <span className="block font-medium text-slate-900">{link.label}</span>
                  {link.description && (
                    <span className="mt-0.5 block text-sm text-slate-500">{link.description}</span>
                  )}
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

export function PrivacyNote() {
  return (
    <aside className="mt-12 rounded-xl border border-slate-200 bg-white px-5 py-4">
      <h2 className="text-base font-semibold text-slate-900">Your file never leaves this device</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        There is no upload endpoint in this application. Your file is read by the browser with the File
        API, changed in memory, and handed back to you as a download. Open your browser’s Network tab
        while you use the tool and you will see no request carrying your file — which also means it works
        with your connection switched off.
      </p>
    </aside>
  );
}
