import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { str as strOrNull } from '@/lib/admin-helpers';

export const dynamic = 'force-dynamic';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const existing = await prisma.targetPage.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = (await request.json()) as Record<string, unknown>;
  const page = await prisma.targetPage.update({
    where: { id: params.id },
    data: {
      keyword: String(body.keyword ?? existing.keyword).trim() || existing.keyword,
      enabled: typeof body.enabled === 'boolean' ? body.enabled : existing.enabled,
      defaultMode: String(body.defaultMode ?? existing.defaultMode) === 'upscale' ? 'upscale' : 'pad',
      introOverride: 'introOverride' in body ? strOrNull(body.introOverride) : existing.introOverride,
      h1Override: 'h1Override' in body ? strOrNull(body.h1Override) : existing.h1Override,
      titleOverride: 'titleOverride' in body ? strOrNull(body.titleOverride) : existing.titleOverride,
      metaOverride: 'metaOverride' in body ? strOrNull(body.metaOverride) : existing.metaOverride,
      sortOrder: Number(body.sortOrder ?? existing.sortOrder) || 0,
    },
  });

  revalidatePath(`/${page.slug}`);
  revalidatePath('/sizes');
  return NextResponse.json({ page });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const page = await prisma.targetPage.findUnique({ where: { id: params.id } });
  if (!page) return new NextResponse(null, { status: 204 });

  await prisma.targetPage.delete({ where: { id: params.id } });
  revalidatePath(`/${page.slug}`);
  revalidatePath('/sizes');
  revalidatePath('/sitemap.xml');
  return new NextResponse(null, { status: 204 });
}
