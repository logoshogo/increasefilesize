import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { getSettings, saveSettings, type SiteSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

const KEYS: (keyof SiteSettings)[] = [
  'siteName',
  'defaultMetaTitle',
  'defaultMetaDescription',
  'googleSiteVerification',
  'bingSiteVerification',
  'googleAnalyticsId',
  'plausibleDomain',
];

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  return NextResponse.json({ settings: await getSettings() });
}

export async function PUT(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const body = (await request.json()) as Record<string, unknown>;
  const values: Partial<SiteSettings> = {};
  for (const key of KEYS) {
    if (typeof body[key] === 'string') values[key] = (body[key] as string).trim();
  }

  await saveSettings(values);
  revalidatePath('/', 'layout');

  return NextResponse.json({ settings: await getSettings() });
}
