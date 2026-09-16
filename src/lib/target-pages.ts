/**
 * Resolves landing pages from the static config plus anything added through
 * /admin/pages. The static array is the baseline; database rows with the same
 * slug override it, and new rows extend it. Nothing here touches user files.
 */

import { prisma, safeQuery } from '@/lib/prisma';
import { TARGET_PAGES, type PageFormat, type TargetPageConfig } from '@/config/target-pages';

function rowToConfig(row: {
  slug: string;
  format: string;
  targetBytes: number | null;
  targetLabel: string | null;
  keyword: string;
  kind: string;
  defaultMode: string;
  introOverride: string | null;
  h1Override: string | null;
  titleOverride: string | null;
  metaOverride: string | null;
}): TargetPageConfig {
  return {
    slug: row.slug,
    format: row.format as PageFormat,
    targetBytes: row.targetBytes ?? undefined,
    targetLabel: row.targetLabel ?? undefined,
    keyword: row.keyword,
    kind: row.kind === 'informational' ? 'informational' : 'tool',
    defaultMode: row.defaultMode === 'upscale' ? 'upscale' : 'pad',
    introOverride: row.introOverride ?? undefined,
    h1Override: row.h1Override ?? undefined,
    titleOverride: row.titleOverride ?? undefined,
    metaOverride: row.metaOverride ?? undefined,
  };
}

/** Every enabled landing page, static config merged with database rows. */
export async function getAllTargetPages(): Promise<TargetPageConfig[]> {
  const rows = await safeQuery(
    () => prisma.targetPage.findMany({ orderBy: [{ sortOrder: 'asc' }, { slug: 'asc' }] }),
    [],
  );

  const merged = new Map<string, TargetPageConfig>();
  for (const page of TARGET_PAGES) merged.set(page.slug, page);

  for (const row of rows) {
    if (!row.enabled) {
      merged.delete(row.slug);
      continue;
    }
    const base = merged.get(row.slug);
    const fromDb = rowToConfig(row);
    // Keep richer static content (extraSections) when the row is an override.
    merged.set(row.slug, base ? { ...base, ...stripEmpty(fromDb) } : fromDb);
  }

  return Array.from(merged.values());
}

function stripEmpty(config: TargetPageConfig): Partial<TargetPageConfig> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(config)) {
    if (value !== undefined && value !== null && value !== '') out[key] = value;
  }
  return out as Partial<TargetPageConfig>;
}

export async function getTargetPageBySlug(slug: string): Promise<TargetPageConfig | null> {
  const pages = await getAllTargetPages();
  return pages.find((p) => p.slug === slug) ?? null;
}
