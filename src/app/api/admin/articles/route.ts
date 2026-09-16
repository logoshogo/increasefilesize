import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { sanitizeArticleHtml, slugify } from '@/lib/sanitize';
import { normaliseStatus, resolvePublishedAt, str } from '@/lib/admin-helpers';

export const dynamic = 'force-dynamic';

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const articles = await prisma.article.findMany({
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      publishedAt: true,
      updatedAt: true,
      excerpt: true,
    },
  });
  return NextResponse.json({ articles });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const body = (await request.json()) as Record<string, unknown>;
  const title = String(body.title ?? '').trim();
  if (!title) return NextResponse.json({ error: 'A title is required.' }, { status: 400 });

  const slug = slugify(String(body.slug ?? '') || title);
  const existing = await prisma.article.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: 'That URL slug is already in use.' }, { status: 409 });
  }

  const status = normaliseStatus(body.status);
  const article = await prisma.article.create({
    data: {
      title,
      slug,
      excerpt: str(body.excerpt),
      content: sanitizeArticleHtml(String(body.content ?? '')),
      metaTitle: str(body.metaTitle),
      metaDescription: str(body.metaDescription),
      ogImage: str(body.ogImage),
      status,
      publishedAt: resolvePublishedAt(status, body.publishedAt),
      authorId: admin.id || null,
    },
  });

  return NextResponse.json({ article }, { status: 201 });
}

