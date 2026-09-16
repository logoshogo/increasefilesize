import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * First-party analytics collector.
 *
 * Accepts a small JSON body describing an action. It does NOT accept files —
 * the request body is capped and any field that is not on the allow-list below
 * is dropped, so there is no path through this route by which file content
 * could reach the server.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_TYPES = new Set([
  'pageview',
  'file_selected',
  'process_started',
  'download_completed',
  'error',
]);

const ALLOWED_FORMATS = new Set(['jpg', 'png', 'pdf', 'any']);
const ALLOWED_MODES = new Set(['pad', 'upscale']);
const MAX_BODY_BYTES = 2048;

function clip(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

export async function POST(request: Request) {
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) {
      return NextResponse.json({ ok: false }, { status: 413 });
    }

    const body = JSON.parse(raw) as Record<string, unknown>;
    const type = clip(body.type, 32);
    if (!type || !ALLOWED_TYPES.has(type)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const format = clip(body.format, 8);
    const mode = clip(body.mode, 16);
    const targetSize =
      typeof body.targetSize === 'number' && Number.isFinite(body.targetSize)
        ? Math.max(0, Math.min(Math.round(body.targetSize), 5_000_000_000))
        : null;

    await prisma.event.create({
      data: {
        type,
        path: clip(body.path, 512) ?? '/',
        format: format && ALLOWED_FORMATS.has(format) ? format : null,
        mode: mode && ALLOWED_MODES.has(mode) ? mode : null,
        targetSize,
        visitorId: clip(body.visitorId, 64),
        referrer: clip(body.referrer, 512),
        userAgent: clip(request.headers.get('user-agent'), 256),
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch {
    // Analytics failures are never surfaced to the visitor.
    return new NextResponse(null, { status: 204 });
  }
}
