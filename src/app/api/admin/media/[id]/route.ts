import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { deleteMedia } from '@/lib/storage';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const media = await prisma.media.findUnique({ where: { id: params.id } });
  if (!media) return new NextResponse(null, { status: 204 });

  // Warn rather than silently orphan an image that is still in an article.
  const usedBy = await prisma.article.count({ where: { content: { contains: media.url } } });
  const force = new URL(_request.url).searchParams.get('force') === '1';
  if (usedBy > 0 && !force) {
    return NextResponse.json(
      { error: `This image is used in ${usedBy} article${usedBy === 1 ? '' : 's'}.`, usedBy },
      { status: 409 },
    );
  }

  await deleteMedia(media.filename).catch(() => null);
  await prisma.media.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}
