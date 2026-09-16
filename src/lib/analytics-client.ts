'use client';

/**
 * First-party event beacon.
 *
 * Sends a few hundred bytes of JSON describing WHAT happened (a pageview, a
 * file being picked, a download completing) — never the file, never the file
 * name, never any of its contents. The tool itself has no upload path; this is
 * the only network call the client makes, and it carries metadata only.
 */

export type EventType =
  | 'pageview'
  | 'file_selected'
  | 'process_started'
  | 'download_completed'
  | 'error';

export interface EventPayload {
  type: EventType;
  path?: string;
  format?: string | null;
  targetSize?: number | null;
  mode?: string | null;
}

const VISITOR_KEY = 'ifs_vid';

/** A random, rotating id used only to count unique visitors. Not a fingerprint. */
export function getVisitorId(): string {
  if (typeof window === 'undefined') return '';
  try {
    const existing = window.localStorage.getItem(VISITOR_KEY);
    if (existing) return existing;
    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2) + Date.now().toString(36);
    window.localStorage.setItem(VISITOR_KEY, id);
    return id;
  } catch {
    // Private mode or blocked storage — events still log, just without an id.
    return '';
  }
}

export function track(payload: EventPayload): void {
  if (typeof window === 'undefined') return;
  const body = JSON.stringify({
    ...payload,
    path: payload.path ?? window.location.pathname,
    visitorId: getVisitorId(),
    referrer: document.referrer || undefined,
  });

  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/events', new Blob([body], { type: 'application/json' }));
      return;
    }
    void fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    });
  } catch {
    // Analytics must never break the tool.
  }
}
