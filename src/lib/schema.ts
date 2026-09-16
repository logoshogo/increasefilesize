/**
 * JSON-LD builders. Every tool page emits SoftwareApplication, FAQPage and
 * HowTo; blog posts emit Article; the site root emits WebSite + Organization.
 */

import type { PageContent } from '@/lib/page-content';

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://increasefilesize.com').replace(
  /\/$/,
  '',
);
export const SITE_NAME = 'increasefilesize.com';

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function softwareApplicationSchema(page: PageContent) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: page.h1,
    url: absoluteUrl(page.slug === '' ? '/' : `/${page.slug}`),
    applicationCategory: 'UtilitiesApplication',
    applicationSubCategory: 'File size converter',
    operatingSystem: 'Any — runs in a web browser (Chrome, Safari, Firefox, Edge)',
    browserRequirements: 'Requires JavaScript. Works offline once loaded.',
    description: page.metaDescription,
    softwareVersion: '1.0',
    isAccessibleForFree: true,
    permissions: 'No account, no file upload — all processing happens in the browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'Increase JPG, PNG and PDF file size to an exact byte target',
      'Padding mode leaves image data bit-for-bit identical',
      'Optional resolution upscaling for genuine quality increase',
      'Entirely client-side — no file is uploaded to a server',
    ],
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
  };
}

export function faqSchema(page: PageContent) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: page.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export function howToSchema(page: PageContent) {
  const label = page.targetLabel ? ` to ${page.targetLabel}` : '';
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: `How to increase ${page.format === 'any' ? 'a file' : `a ${page.format.toUpperCase()} file`}'s size${label}`,
    description: page.answer,
    totalTime: 'PT1M',
    estimatedCost: {
      '@type': 'MonetaryAmount',
      currency: 'USD',
      value: '0',
    },
    tool: [{ '@type': 'HowToTool', name: 'A web browser' }],
    supply: [{ '@type': 'HowToSupply', name: `A ${page.format === 'any' ? 'JPG, PNG or PDF' : page.format.toUpperCase()} file` }],
    step: page.steps.map((step, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: step.name,
      text: step.text,
      url: `${absoluteUrl(page.slug === '' ? '/' : `/${page.slug}`)}#how-it-works`,
    })),
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description:
      'Free browser-based tools that increase the file size of JPG, PNG and PDF files to an exact target, without uploading anything.',
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
  };
}

export function articleSchema(article: {
  slug: string;
  title: string;
  excerpt?: string | null;
  metaDescription?: string | null;
  publishedAt?: Date | null;
  updatedAt?: Date | null;
  ogImage?: string | null;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.metaDescription ?? article.excerpt ?? undefined,
    url: absoluteUrl(`/blog/${article.slug}`),
    mainEntityOfPage: absoluteUrl(`/blog/${article.slug}`),
    datePublished: article.publishedAt?.toISOString(),
    dateModified: (article.updatedAt ?? article.publishedAt)?.toISOString(),
    image: article.ogImage ? absoluteUrl(article.ogImage) : undefined,
    author: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
  };
}

/** Renders a JSON-LD script tag payload safely. */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
