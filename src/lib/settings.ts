import { prisma, safeQuery } from '@/lib/prisma';

export interface SiteSettings {
  siteName: string;
  defaultMetaTitle: string;
  defaultMetaDescription: string;
  googleSiteVerification: string;
  bingSiteVerification: string;
  googleAnalyticsId: string;
  plausibleDomain: string;
}

export const DEFAULT_SETTINGS: SiteSettings = {
  siteName: 'increasefilesize.com',
  defaultMetaTitle: 'Increase File Size Online Free — JPG, PNG and PDF',
  defaultMetaDescription:
    'Increase the file size of a JPG, PNG or PDF to an exact KB or MB target. Free, no signup, runs in your browser — your file is never uploaded.',
  googleSiteVerification: '',
  bingSiteVerification: '',
  googleAnalyticsId: '',
  plausibleDomain: '',
};

export async function getSettings(): Promise<SiteSettings> {
  const rows = await safeQuery(() => prisma.setting.findMany(), []);
  const map = new Map(rows.map((r) => [r.key, r.value]));
  return {
    siteName: map.get('siteName') || DEFAULT_SETTINGS.siteName,
    defaultMetaTitle: map.get('defaultMetaTitle') || DEFAULT_SETTINGS.defaultMetaTitle,
    defaultMetaDescription: map.get('defaultMetaDescription') || DEFAULT_SETTINGS.defaultMetaDescription,
    googleSiteVerification: map.get('googleSiteVerification') ?? '',
    bingSiteVerification: map.get('bingSiteVerification') ?? '',
    googleAnalyticsId: map.get('googleAnalyticsId') ?? '',
    plausibleDomain: map.get('plausibleDomain') ?? '',
  };
}

export async function saveSettings(values: Partial<SiteSettings>): Promise<void> {
  const entries = Object.entries(values).filter(([, v]) => typeof v === 'string');
  await Promise.all(
    entries.map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        create: { key, value: value as string },
        update: { value: value as string },
      }),
    ),
  );
}
