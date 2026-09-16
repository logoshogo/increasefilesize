import { prisma, safeQuery } from '@/lib/prisma';

/**
 * Dashboard aggregations over the Event table.
 *
 * Bucketing for the charts is done in JS rather than SQL so the same code runs
 * unchanged on SQLite (dev) and Postgres (production) — date_trunc and
 * strftime are not portable between them. The row fetch is capped; at higher
 * volume, swap `timeSeries` for a provider-specific SQL aggregation.
 */

export type RangeKey = '24h' | '7d' | '30d';

export const RANGE_MS: Record<RangeKey, number> = {
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
};

const SERIES_ROW_CAP = 50_000;

export interface DashboardStats {
  range: RangeKey;
  generatedAt: string;
  live: {
    activeNow: number;
    visitorsToday: number;
    pageviewsToday: number;
    downloadsToday: number;
  };
  totals: {
    pageviews: number;
    fileSelected: number;
    processStarted: number;
    downloads: number;
    errors: number;
    uniqueVisitors: number;
  };
  funnel: { step: string; count: number; rate: number }[];
  byFormat: { format: string; count: number }[];
  byTargetSize: { label: string; bytes: number; count: number }[];
  byMode: { mode: string; count: number }[];
  topPages: { path: string; count: number }[];
  series: { bucket: string; pageviews: number; downloads: number }[];
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function labelForBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    const mb = bytes / (1024 * 1024);
    return `${mb % 1 === 0 ? mb : mb.toFixed(1)}MB`;
  }
  const kb = bytes / 1024;
  return `${kb % 1 === 0 ? kb : kb.toFixed(0)}KB`;
}

export async function getDashboardStats(range: RangeKey = '7d'): Promise<DashboardStats> {
  const since = new Date(Date.now() - RANGE_MS[range]);
  const today = startOfToday();
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  const empty: DashboardStats = {
    range,
    generatedAt: new Date().toISOString(),
    live: { activeNow: 0, visitorsToday: 0, pageviewsToday: 0, downloadsToday: 0 },
    totals: {
      pageviews: 0,
      fileSelected: 0,
      processStarted: 0,
      downloads: 0,
      errors: 0,
      uniqueVisitors: 0,
    },
    funnel: [],
    byFormat: [],
    byTargetSize: [],
    byMode: [],
    topPages: [],
    series: [],
  };

  return safeQuery(async () => {
    const [
      typeCounts,
      activeNow,
      visitorsToday,
      pageviewsToday,
      downloadsToday,
      uniqueVisitors,
      formatRows,
      modeRows,
      sizeRows,
      pathRows,
      seriesRows,
    ] = await Promise.all([
      prisma.event.groupBy({
        by: ['type'],
        where: { createdAt: { gte: since } },
        _count: { _all: true },
      }),
      prisma.event
        .findMany({
          where: { createdAt: { gte: fiveMinutesAgo }, visitorId: { not: null } },
          distinct: ['visitorId'],
          select: { visitorId: true },
        })
        .then((rows) => rows.length),
      prisma.event
        .findMany({
          where: { createdAt: { gte: today }, type: 'pageview', visitorId: { not: null } },
          distinct: ['visitorId'],
          select: { visitorId: true },
        })
        .then((rows) => rows.length),
      prisma.event.count({ where: { createdAt: { gte: today }, type: 'pageview' } }),
      prisma.event.count({ where: { createdAt: { gte: today }, type: 'download_completed' } }),
      prisma.event
        .findMany({
          where: { createdAt: { gte: since }, visitorId: { not: null } },
          distinct: ['visitorId'],
          select: { visitorId: true },
        })
        .then((rows) => rows.length),
      prisma.event.groupBy({
        by: ['format'],
        where: { createdAt: { gte: since }, type: 'download_completed', format: { not: null } },
        _count: { _all: true },
      }),
      prisma.event.groupBy({
        by: ['mode'],
        where: { createdAt: { gte: since }, type: 'download_completed', mode: { not: null } },
        _count: { _all: true },
      }),
      prisma.event.groupBy({
        by: ['targetSize'],
        where: { createdAt: { gte: since }, type: 'process_started', targetSize: { not: null } },
        _count: { _all: true },
      }),
      prisma.event.groupBy({
        by: ['path'],
        where: { createdAt: { gte: since }, type: 'pageview' },
        _count: { _all: true },
      }),
      prisma.event.findMany({
        where: { createdAt: { gte: since }, type: { in: ['pageview', 'download_completed'] } },
        select: { createdAt: true, type: true },
        orderBy: { createdAt: 'asc' },
        take: SERIES_ROW_CAP,
      }),
    ]);

    const countOf = (type: string) =>
      typeCounts.find((row) => row.type === type)?._count._all ?? 0;

    const pageviews = countOf('pageview');
    const fileSelected = countOf('file_selected');
    const processStarted = countOf('process_started');
    const downloads = countOf('download_completed');
    const errors = countOf('error');

    const funnelSteps = [
      { step: 'Page view', count: pageviews },
      { step: 'File selected', count: fileSelected },
      { step: 'Processing started', count: processStarted },
      { step: 'Download completed', count: downloads },
    ];
    const funnel = funnelSteps.map((s) => ({
      ...s,
      rate: pageviews > 0 ? Math.round((s.count / pageviews) * 1000) / 10 : 0,
    }));

    // Hourly buckets for 24h, daily for longer ranges.
    const hourly = range === '24h';
    const buckets = new Map<string, { pageviews: number; downloads: number }>();
    for (const row of seriesRows) {
      const d = new Date(row.createdAt);
      if (hourly) d.setMinutes(0, 0, 0);
      else d.setHours(0, 0, 0, 0);
      const key = d.toISOString();
      const entry = buckets.get(key) ?? { pageviews: 0, downloads: 0 };
      if (row.type === 'pageview') entry.pageviews += 1;
      else entry.downloads += 1;
      buckets.set(key, entry);
    }

    // Fill empty buckets so the chart has a continuous x-axis.
    const series: DashboardStats['series'] = [];
    const step = hourly ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    const cursor = new Date(since);
    if (hourly) cursor.setMinutes(0, 0, 0);
    else cursor.setHours(0, 0, 0, 0);
    const end = Date.now();
    for (let t = cursor.getTime(); t <= end; t += step) {
      const key = new Date(t).toISOString();
      const entry = buckets.get(key) ?? { pageviews: 0, downloads: 0 };
      series.push({ bucket: key, ...entry });
    }

    return {
      range,
      generatedAt: new Date().toISOString(),
      live: { activeNow, visitorsToday, pageviewsToday, downloadsToday },
      totals: { pageviews, fileSelected, processStarted, downloads, errors, uniqueVisitors },
      funnel,
      series,
      byFormat: formatRows
        .map((r) => ({ format: r.format ?? 'unknown', count: r._count._all }))
        .sort((a, b) => b.count - a.count),
      byMode: modeRows
        .map((r) => ({ mode: r.mode ?? 'unknown', count: r._count._all }))
        .sort((a, b) => b.count - a.count),
      byTargetSize: sizeRows
        .map((r) => ({
          bytes: r.targetSize ?? 0,
          label: labelForBytes(r.targetSize ?? 0),
          count: r._count._all,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 12),
      topPages: pathRows
        .map((r) => ({ path: r.path, count: r._count._all }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 15),
    };
  }, empty);
}

/** Pageview counts per landing page path, for the admin page manager. */
export async function getPageviewsByPath(days = 30): Promise<Map<string, number>> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const rows = await safeQuery(
    () =>
      prisma.event.groupBy({
        by: ['path'],
        where: { createdAt: { gte: since }, type: 'pageview' },
        _count: { _all: true },
      }),
    [],
  );
  return new Map(rows.map((r) => [r.path, r._count._all]));
}
