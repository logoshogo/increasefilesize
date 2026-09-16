import type { Metadata } from 'next';
import Script from 'next/script';
import '../globals.css';
import { SiteHeader } from '@/components/site/SiteHeader';
import { SiteFooter } from '@/components/site/SiteFooter';
import { PageviewTracker } from '@/components/analytics/PageviewTracker';
import { getSettings } from '@/lib/settings';
import { SITE_URL, jsonLd, websiteSchema } from '@/lib/schema';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: settings.defaultMetaTitle,
      template: '%s',
    },
    description: settings.defaultMetaDescription,
    applicationName: settings.siteName,
    verification: settings.googleSiteVerification
      ? { google: settings.googleSiteVerification, other: settings.bingSiteVerification ? { 'msvalidate.01': settings.bingSiteVerification } : undefined }
      : settings.bingSiteVerification
        ? { other: { 'msvalidate.01': settings.bingSiteVerification } }
        : undefined,
    openGraph: {
      type: 'website',
      siteName: settings.siteName,
      title: settings.defaultMetaTitle,
      description: settings.defaultMetaDescription,
      url: SITE_URL,
    },
    twitter: {
      card: 'summary_large_image',
      title: settings.defaultMetaTitle,
      description: settings.defaultMetaDescription,
    },
    robots: { index: true, follow: true },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();

  return (
    <html lang="en">
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(websiteSchema()) }} />
      </head>
      <body className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <PageviewTracker />

        {settings.plausibleDomain && (
          <Script
            defer
            data-domain={settings.plausibleDomain}
            src="https://plausible.io/js/script.js"
            strategy="afterInteractive"
          />
        )}
        {settings.googleAnalyticsId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${settings.googleAnalyticsId}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${settings.googleAnalyticsId}');`}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
