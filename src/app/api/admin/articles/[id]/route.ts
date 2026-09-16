import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { sanitizeArticleHtml, slugify } from '@/lib/sanitize';
import { normaliseStatus, resolvePublishedAt, str } from '@/lib/admin-helpers';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const article = await prisma.article.findUnique({ where: { id: params.id } });
  if (!article) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ article });
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const existing = await prisma.article.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = (await request.json()) as Record<string, unknown>;
  const title = String(body.title ?? existing.title).trim();
  const slug = slugify(String(body.slug ?? '') || title);

  if (slug !== existing.slug) {
    const clash = await prisma.article.findUnique({ where: { slug } });
    if (clash) return NextResponse.json({ error: 'That URL slug is already in use.' }, { status: 409 });
  }

  const status = normaliseStatus(body.status ?? existing.status);
  // Keep the original publish date when an already-published post is edited.
  const publishedAt =
    status === 'PUBLISHED' && existing.publishedAt && !body.publishedAt
      ? existing.publishedAt
      : resolvePublishedAt(status, body.publishedAt);

  const article = await prisma.article.update({
    where: { id: params.id },
    data: {
      title,
      slug,
      excerpt: str(body.excerpt),
      content: sanitizeArticleHtml(String(body.content ?? existing.content)),
      metaTitle: str(body.metaTitle),
      metaDescription: str(body.metaDescription),
      ogImage: str(body.ogImage),
      status,
      publishedAt,
    },
  });

  return NextResponse.json({ article });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  await prisma.article.delete({ where: { id: params.id } }).catch(() => null);
  return new NextResponse(null, { status: 204 });
}
