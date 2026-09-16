import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { saveMedia } from '@/lib/storage';

/**
 * Blog media library. This is the only upload endpoint in the application, it
 * requires an admin session, and it is never touched by the public file size
 * tool — visitor files have no route to the server at all.
 */

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const media = await prisma.media.findMany({ orderBy: { createdAt: 'desc' }, take: 300 });
  return NextResponse.json({ media });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file was provided.' }, { status: 400 });
  }

  try {
    const stored = await saveMedia(file);
    const media = await prisma.media.create({
      data: {
        url: stored.url,
        filename: stored.filename,
        mimeType: stored.mimeType,
        size: stored.size,
        alt: String(form.get('alt') ?? '') || null,
      },
    });
    return NextResponse.json({ media }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
