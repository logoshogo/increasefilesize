import type { Metadata } from 'next';
import Link from 'next/link';
import { getPublishedArticles } from '@/lib/articles';

export const revalidate = 600;

export const metadata: Metadata = {
  title: 'Blog — File Sizes, Uploads and Compression | increasefilesize.com',
  description:
    'Plain explanations of file size, compression, resolution and upload limits — why forms reject files and what to do about it.',
  alternates: { canonical: '/blog' },
};

export default async function BlogIndexPage() {
  const articles = await getPublishedArticles();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Blog</h1>
      <p className="mt-4 text-lg leading-relaxed text-slate-600">
        How file size actually works, why upload forms behave the way they do, and how to get a file to
        the size a form is asking for without damaging it.
      </p>

      {articles.length === 0 ? (
        <p className="mt-10 rounded-xl border border-slate-200 bg-white px-5 py-8 text-center text-slate-500">
          No articles published yet.
        </p>
      ) : (
        <ul className="mt-10 space-y-4">
          {articles.map((article) => (
            <li key={article.slug}>
              <Link
                href={`/blog/${article.slug}`}
                className="block rounded-xl border border-slate-200 bg-white px-5 py-5 transition hover:border-brand-300 hover:shadow-sm"
              >
                <h2 className="text-lg font-semibold text-slate-900">{article.title}</h2>
                {article.excerpt && (
                  <p className="mt-2 leading-relaxed text-slate-600">{article.excerpt}</p>
                )}
                {article.publishedAt && (
                  <p className="mt-3 text-sm text-slate-500">
                    {new Date(article.publishedAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
