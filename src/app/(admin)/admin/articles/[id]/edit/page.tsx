import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ArticleEditor } from '@/components/admin/ArticleEditor';

export const dynamic = 'force-dynamic';

/** Formats a Date for a datetime-local input in the server's local time. */
function toLocalInput(date: Date | null): string {
  if (!date) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default async function EditArticlePage({ params }: { params: { id: string } }) {
  const article = await prisma.article.findUnique({ where: { id: params.id } }).catch(() => null);
  if (!article) notFound();

  return (
    <ArticleEditor
      initial={{
        id: article.id,
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt ?? '',
        content: article.content,
        metaTitle: article.metaTitle ?? '',
        metaDescription: article.metaDescription ?? '',
        ogImage: article.ogImage ?? '',
        status: article.status as 'DRAFT' | 'PUBLISHED' | 'SCHEDULED',
        publishedAt: toLocalInput(article.publishedAt),
      }}
    />
  );
}
