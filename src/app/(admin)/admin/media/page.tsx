import { prisma, safeQuery } from '@/lib/prisma';
import { MediaManager } from '@/components/admin/MediaManager';

export const dynamic = 'force-dynamic';

export default async function AdminMediaPage() {
  const media = await safeQuery(
    () => prisma.media.findMany({ orderBy: { createdAt: 'desc' }, take: 300 }),
    [],
  );

  return (
    <MediaManager
      initial={media.map((m) => ({
        id: m.id,
        url: m.url,
        filename: m.filename,
        mimeType: m.mimeType,
        size: m.size,
        alt: m.alt,
        createdAt: m.createdAt.toISOString(),
      }))}
    />
  );
}
