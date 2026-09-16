import type { Metadata } from 'next';
import { FormatHub } from '@/components/site/FormatHub';
import { buildHubContent } from '@/lib/page-content';

const page = buildHubContent('png');

export const metadata: Metadata = {
  title: page.title,
  description: page.metaDescription,
  alternates: { canonical: '/png' },
  openGraph: { type: 'website', title: page.title, description: page.metaDescription, url: '/png' },
};

/** Format hub — PNG. */
export default function PNGHubPage() {
  return <FormatHub format="png" />;
}
