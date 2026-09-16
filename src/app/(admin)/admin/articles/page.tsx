import Link from 'next/link';
import { prisma, safeQuery } from '@/lib/prisma';
import { ArticleRowActions } from '@/components/admin/ArticleRowActions';

export const dynamic = 'force-dynamic';

const STATUS_STYLE: Record<string, string> = {
  PUBLISHED: 'bg-emerald-100 text-emerald-800',
  DRAFT: 'bg-slate-100 text-slate-600',
  SCHEDULED: 'bg-amber-100 text-amber-800',
};

export default async function AdminArticlesPage() {
  const articles = await safeQuery(
    () =>
      prisma.article.findMany({
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          slug: true,
          title: true,
          status: true,
          publishedAt: true,
          updatedAt: true,
        },
      }),
    [],
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Articles</h1>
          <p className="mt-1 text-sm text-slate-500">{articles.length} in the blog</p>
        </div>
        <Link
          href="/admin/articles/new"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          New article
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {articles.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-slate-500">
            No articles yet. Run <code className="rounded bg-slate-100 px-1.5 py-0.5">npm run db:seed</code>{' '}
            to load the starter set, or create one.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Title</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="hidden px-5 py-3 font-medium sm:table-cell">Last edited</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {articles.map((article) => (
                <tr key={article.id}>
                  <td className="px-5 py-3">
                    <Link
                      href={`/admin/articles/${article.id}/edit`}
                      className="font-medium text-slate-900 hover:text-brand-700"
                    >
                      {article.title}
                    </Link>
                    <p className="text-xs text-slate-400">/blog/{article.slug}</p>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        STATUS_STYLE[article.status] ?? STATUS_STYLE.DRAFT
                      }`}
                    >
                      {article.status.toLowerCase()}
                    </span>
                    {article.status === 'SCHEDULED' && article.publishedAt && (
                      <p className="mt-1 text-xs text-slate-400">
                        {new Date(article.publishedAt).toLocaleString('en-GB')}
                      </p>
                    )}
                  </td>
                  <td className="hidden px-5 py-3 text-slate-500 sm:table-cell">
                    {new Date(article.updatedAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <ArticleRowActions id={article.id} slug={article.slug} status={article.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
