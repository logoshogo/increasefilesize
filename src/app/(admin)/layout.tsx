import type { Metadata } from 'next';
import '../globals.css';

/**
 * Root layout for the admin route group.
 *
 * The admin is deliberately a separate root layout from the public site: it
 * must not render the public header, footer or pageview beacon, and it is
 * marked noindex here as well as in robots.txt and the X-Robots-Tag header set
 * in next.config.mjs.
 */
export const metadata: Metadata = {
  title: 'Admin — increasefilesize.com',
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-100">{children}</body>
    </html>
  );
}
