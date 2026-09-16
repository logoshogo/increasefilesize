import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LandingPageTemplate } from '@/components/site/LandingPageTemplate';
import { buildPageContent } from '@/lib/page-content';
import { TARGET_PAGES } from '@/config/target-pages';
import { getTargetPageBySlug } from '@/lib/target-pages';

/**
 * The single template behind every target-size landing page.
 *
 * Params come from the static config at build time; pages added later through
 * /admin/pages are rendered on demand (dynamicParams) and then cached, so a new
 * target size never needs a deploy.
 */

export const dynamicParams = true;
export const revalidate = 3600;

export function generateStaticParams() {
  return TARGET_PAGES.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const config = await getTargetPageBySlug(params.slug);
  if (!config) return {};
  const page = buildPageContent(config);
  return {
    title: page.title,
    description: page.metaDescription,
    alternates: { canonical: `/${page.slug}` },
    openGraph: {
      type: 'website',
      title: page.title,
      description: page.metaDescription,
      url: `/${page.slug}`,
    },
  };
}

export default async function TargetSizePage({ params }: { params: { slug: string } }) {
  const config = await getTargetPageBySlug(params.slug);
  if (!config) notFound();

  return <LandingPageTemplate page={buildPageContent(config)} />;
}
