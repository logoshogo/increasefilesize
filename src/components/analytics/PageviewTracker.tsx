'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { track } from '@/lib/analytics-client';

/** Logs one pageview per path change. Metadata only — no file data ever. */
export function PageviewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith('/admin')) return;
    track({ type: 'pageview', path: pathname });
  }, [pathname]);

  return null;
}
