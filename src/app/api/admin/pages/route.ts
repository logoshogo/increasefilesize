import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { slugify } from '@/lib/sanitize';
import { parseTargetSize, formatBytes } from '@/lib/engines/bytes';
import { str as strOrNull } from '@/lib/admin-helpers';

export const dynamic = 'force-dynamic';

const FORMATS = new Set(['jpg', 'png', 'pdf', 'any']);

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const pages = await prisma.targetPage.findMany({ orderBy: [{ sortOrder: 'asc' }, { slug: 'asc' }] });
  return NextResponse.json({ pages });
}

/**
 * Adds a landing page without a code change. The dynamic route picks it up on
 * its next revalidation, and revalidatePath below makes the index pages
 * refresh immediately.
 */
export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const body = (await request.json()) as Record<string, unknown>;
  const format = String(body.format ?? 'any').toLowerCase();
  if (!FORMATS.has(format)) {
    return NextResponse.json({ error: 'Format must be jpg, png, pdf or any.' }, { status: 400 });
  }

  const sizeInput = String(body.targetSize ?? '').trim();
  const targetBytes = sizeInput ? parseTargetSize(sizeInput, 'KB') : null;
  if (sizeInput && !targetBytes) {
    return NextResponse.json({ error: 'Could not read that size — try "100kb" or "2mb".' }, { status: 400 });
  }

  const targetLabel = targetBytes ? formatBytes(targetBytes).replace(/\s/g, '') : null;
  const slug = slugify(
    String(body.slug ?? '') ||
      (targetLabel
        ? `increase-${format === 'any' ? 'file' : format}-file-size-to-${targetLabel}`
        : `increase-${format === 'any' ? 'file' : format}-file-size`),
  );

  const clash = await prisma.targetPage.findUnique({ where: { slug } });
  if (clash) return NextResponse.json({ error: 'A page with that URL already exists.' }, { status: 409 });

  const page = await prisma.targetPage.create({
    data: {
      slug,
      format,
      targetBytes,
      targetLabel,
      keyword:
        String(body.keyword ?? '').trim() ||
        `increase ${format === 'any' ? 'file' : format} file size${targetLabel ? ` to ${targetLabel.toLowerCase()}` : ''}`,
      kind: String(body.kind ?? 'tool') === 'informational' ? 'informational' : 'tool',
      defaultMode: String(body.defaultMode ?? 'pad') === 'upscale' ? 'upscale' : 'pad',
      introOverride: strOrNull(body.introOverride),
      h1Override: strOrNull(body.h1Override),
      titleOverride: strOrNull(body.titleOverride),
      metaOverride: strOrNull(body.metaOverride),
      sortOrder: Number(body.sortOrder ?? 0) || 0,
    },
  });

  revalidatePath('/sizes');
  revalidatePath(`/${slug}`);
  revalidatePath('/sitemap.xml');

  return NextResponse.json({ page }, { status: 201 });
}

