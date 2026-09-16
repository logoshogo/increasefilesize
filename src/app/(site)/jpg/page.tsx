import type { Metadata } from 'next';
import { FormatHub } from '@/components/site/FormatHub';
import { buildHubContent } from '@/lib/page-content';

const page = buildHubContent('jpg');

export const metadata: Metadata = {
  title: page.title,
  description: page.metaDescription,
  alternates: { canonical: '/jpg' },
  openGraph: { type: 'website', title: page.title, description: page.metaDescription, url: '/jpg' },
};

/** Format hub — JPG. */
export default function JPGHubPage() {
  return <FormatHub format="jpg" />;
}
