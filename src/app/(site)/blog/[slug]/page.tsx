import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getArticleBySlug, getPublishedArticles } from '@/lib/articles';
import { articleSchema, breadcrumbSchema, jsonLd } from '@/lib/schema';
import { PrivacyNote } from '@/components/site/LandingPageTemplate';

export const revalidate = 600;
export const dynamicParams = true;

export async function generateStaticParams() {
  const articles = await getPublishedArticles();
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const article = await getArticleBySlug(params.slug);
  if (!article) return {};
  return {
    title: article.metaTitle ?? article.title,
    description: article.metaDescription ?? article.excerpt ?? undefined,
    alternates: { canonical: `/blog/${article.slug}` },
    openGraph: {
      type: 'article',
      title: article.metaTitle ?? article.title,
      description: article.metaDescription ?? article.excerpt ?? undefined,
      url: `/blog/${article.slug}`,
      images: article.ogImage ? [article.ogImage] : undefined,
      publishedTime: article.publishedAt?.toISOString(),
    },
  };
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const article = await getArticleBySlug(params.slug);
  if (!article) notFound();

  const others = (await getPublishedArticles()).filter((a) => a.slug !== article.slug).slice(0, 3);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(articleSchema(article)) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            breadcrumbSchema([
              { name: 'Home', path: '/' },
              { name: 'Blog', path: '/blog' },
              { name: article.title, path: `/blog/${article.slug}` },
            ]),
          ),
        }}
      />

      <article className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <nav aria-label="Breadcrumb" className="mb-4 text-sm text-slate-500">
          <Link href="/" className="hover:text-brand-700">
            Home
          </Link>
          <span className="mx-2" aria-hidden>
            /
          </span>
          <Link href="/blog" className="hover:text-brand-700">
            Blog
          </Link>
        </nav>

        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{article.title}</h1>
        {article.publishedAt && (
          <p className="mt-3 text-sm text-slate-500">
            {new Date(article.publishedAt).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        )}

        {/* Content is authored in the admin Tiptap editor, which emits sanitised HTML. */}
        <div
          className="prose-article mt-8"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        <div className="mt-12 rounded-xl border border-brand-200 bg-brand-50 px-5 py-5">
          <h2 className="text-lg font-semibold text-slate-900">Need a file at an exact size?</h2>
          <p className="mt-2 text-slate-700">
            The tool on this site sets a JPG, PNG or PDF to any target in KB or MB, in your browser, with
            no upload.
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Open the tool
          </Link>
        </div>

        {others.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Keep reading</h2>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {others.map((other) => (
                <li key={other.slug}>
                  <Link
                    href={`/blog/${other.slug}`}
                    className="block h-full rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:border-brand-300 hover:shadow-sm"
                  >
                    <span className="block font-medium text-slate-900">{other.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <PrivacyNote />
      </article>
    </>
  );
}
