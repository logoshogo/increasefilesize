import { prisma, safeQuery } from '@/lib/prisma';
import { BLOG_SEEDS } from '@/config/blog-seed';

export interface PublicArticle {
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  metaTitle: string | null;
  metaDescription: string | null;
  ogImage: string | null;
  publishedAt: Date | null;
  updatedAt: Date | null;
}

/** A scheduled post becomes public once its publish time has passed. */
function publicWhere() {
  const now = new Date();
  return {
    OR: [
      { status: 'PUBLISHED' as const },
      { status: 'SCHEDULED' as const, publishedAt: { lte: now } },
    ],
  };
}

function seedFallback(): PublicArticle[] {
  // Used only when the database is unavailable (e.g. a build before db:push),
  // so the blog still renders its seeded content instead of 500ing.
  return BLOG_SEEDS.map((seed) => ({
    slug: seed.slug,
    title: seed.title,
    excerpt: seed.excerpt,
    content: seed.content,
    metaTitle: seed.metaTitle,
    metaDescription: seed.metaDescription,
    ogImage: null,
    publishedAt: null,
    updatedAt: null,
  }));
}

export async function getPublishedArticles(): Promise<PublicArticle[]> {
  return safeQuery(
    () =>
      prisma.article.findMany({
        where: publicWhere(),
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
        select: {
          slug: true,
          title: true,
          excerpt: true,
          content: true,
          metaTitle: true,
          metaDescription: true,
          ogImage: true,
          publishedAt: true,
          updatedAt: true,
        },
      }),
    seedFallback(),
  );
}

export async function getArticleBySlug(slug: string): Promise<PublicArticle | null> {
  const fallback = seedFallback().find((a) => a.slug === slug) ?? null;
  return safeQuery(
    () =>
      prisma.article.findFirst({
        where: { slug, ...publicWhere() },
        select: {
          slug: true,
          title: true,
          excerpt: true,
          content: true,
          metaTitle: true,
          metaDescription: true,
          ogImage: true,
          publishedAt: true,
          updatedAt: true,
        },
      }),
    fallback,
  );
}
