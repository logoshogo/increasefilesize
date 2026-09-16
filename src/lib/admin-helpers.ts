/** Small shared helpers for the admin API routes. */

export function normaliseStatus(value: unknown): 'DRAFT' | 'PUBLISHED' | 'SCHEDULED' {
  const status = String(value ?? 'DRAFT').toUpperCase();
  return status === 'PUBLISHED' || status === 'SCHEDULED' ? status : 'DRAFT';
}

/**
 * Publishing with no explicit date means "now"; scheduling requires one.
 * A draft never carries a publish date.
 */
export function resolvePublishedAt(status: string, raw: unknown): Date | null {
  if (status === 'PUBLISHED') {
    const parsed = raw ? new Date(String(raw)) : new Date();
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  }
  if (status === 'SCHEDULED' && raw) {
    const parsed = new Date(String(raw));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

/** Trims a value to a string, or null when it is empty. */
export function str(value: unknown): string | null {
  const text = typeof value === 'string' ? value.trim() : '';
  return text ? text : null;
}
