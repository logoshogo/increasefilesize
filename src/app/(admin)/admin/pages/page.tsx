import { prisma, safeQuery } from '@/lib/prisma';
import { TARGET_PAGES } from '@/config/target-pages';
import { getPageviewsByPath } from '@/lib/stats';
import { PageManager, type ManagedPage } from '@/components/admin/PageManager';

export const dynamic = 'force-dynamic';

export default async function AdminPagesPage() {
  const [rows, views] = await Promise.all([
    safeQuery(() => prisma.targetPage.findMany({ orderBy: [{ sortOrder: 'asc' }, { slug: 'asc' }] }), []),
    getPageviewsByPath(30),
  ]);

  const dbBySlug = new Map(rows.map((r) => [r.slug, r]));

  // Static config pages first, then anything added through this screen.
  const staticPages: ManagedPage[] = TARGET_PAGES.map((page) => {
    const row = dbBySlug.get(page.slug);
    return {
      id: row?.id ?? null,
      slug: page.slug,
      format: page.format,
      keyword: row?.keyword ?? page.keyword,
      targetLabel: row?.targetLabel ?? page.targetLabel ?? null,
      kind: (row?.kind ?? page.kind) as ManagedPage['kind'],
      defaultMode: (row?.defaultMode ?? page.defaultMode ?? 'pad') as ManagedPage['defaultMode'],
      enabled: row?.enabled ?? true,
      source: 'config',
      views: views.get(`/${page.slug}`) ?? 0,
    };
  });

  const dbOnly: ManagedPage[] = rows
    .filter((row) => !TARGET_PAGES.some((p) => p.slug === row.slug))
    .map((row) => ({
      id: row.id,
      slug: row.slug,
      format: row.format as ManagedPage['format'],
      keyword: row.keyword,
      targetLabel: row.targetLabel,
      kind: row.kind as ManagedPage['kind'],
      defaultMode: row.defaultMode as ManagedPage['defaultMode'],
      enabled: row.enabled,
      source: 'database',
      views: views.get(`/${row.slug}`) ?? 0,
    }));

  return <PageManager initial={[...dbOnly, ...staticPages]} />;
}
