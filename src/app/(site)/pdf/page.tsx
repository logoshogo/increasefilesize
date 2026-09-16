import type { Metadata } from 'next';
import { FormatHub } from '@/components/site/FormatHub';
import { buildHubContent } from '@/lib/page-content';

const page = buildHubContent('pdf');

export const metadata: Metadata = {
  title: page.title,
  description: page.metaDescription,
  alternates: { canonical: '/pdf' },
  openGraph: { type: 'website', title: page.title, description: page.metaDescription, url: '/pdf' },
};

/** Format hub — PDF. */
export default function PDFHubPage() {
  return <FormatHub format="pdf" />;
}
