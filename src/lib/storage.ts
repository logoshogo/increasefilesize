/**
 * Media storage driver for blog images.
 *
 * Only blog/editorial images go through here — visitor files never do, and
 * there is no route that would let them.
 *
 * `local` writes to /public/uploads and is for development. Vercel's runtime
 * filesystem is read-only, so production should set MEDIA_DRIVER=s3 and supply
 * the S3/R2 credentials; `putObject` below is the only function that needs a
 * concrete implementation to switch over, and the rest of the app is unaware
 * of which driver is active.
 */

import { mkdir, writeFile, unlink } from 'node:fs/promises';
import { join } from 'node:path';

export interface StoredMedia {
  url: string;
  filename: string;
  mimeType: string;
  size: number;
}

export const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
]);

export const MAX_MEDIA_BYTES = 8 * 1024 * 1024;

const DRIVER = (process.env.MEDIA_DRIVER ?? 'local').toLowerCase();
const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads');

export function safeFilename(original: string): string {
  const cleaned = original
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(-80);
  const stamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  return `${stamp}-${random}-${cleaned || 'image'}`;
}

export async function saveMedia(file: File): Promise<StoredMedia> {
  if (!ALLOWED_MIME.has(file.type)) {
    throw new Error('Only JPG, PNG, GIF, WebP and SVG images can be uploaded.');
  }
  if (file.size > MAX_MEDIA_BYTES) {
    throw new Error('Images must be 8MB or smaller.');
  }

  const filename = safeFilename(file.name);
  const bytes = Buffer.from(await file.arrayBuffer());

  if (DRIVER === 's3') {
    const url = await putObject(filename, bytes, file.type);
    return { url, filename, mimeType: file.type, size: bytes.length };
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(join(UPLOAD_DIR, filename), bytes);
  return { url: `/uploads/${filename}`, filename, mimeType: file.type, size: bytes.length };
}

export async function deleteMedia(filename: string): Promise<void> {
  if (DRIVER === 's3') {
    await removeObject(filename);
    return;
  }
  try {
    await unlink(join(UPLOAD_DIR, filename));
  } catch {
    // Already gone — deleting the database row is what matters.
  }
}

/* ------------------------------------------------------------------ */
/* S3 / Cloudflare R2 driver                                           */
/* ------------------------------------------------------------------ */

/**
 * To enable: `npm i @aws-sdk/client-s3`, set MEDIA_DRIVER=s3 and the S3_*
 * environment variables, then replace the body below with:
 *
 *   const client = new S3Client({
 *     region: 'auto',
 *     endpoint: process.env.S3_ENDPOINT,
 *     credentials: {
 *       accessKeyId: process.env.S3_ACCESS_KEY_ID!,
 *       secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
 *     },
 *   });
 *   await client.send(new PutObjectCommand({
 *     Bucket: process.env.S3_BUCKET!,
 *     Key: filename,
 *     Body: bytes,
 *     ContentType: mimeType,
 *   }));
 *   return `${process.env.S3_PUBLIC_BASE_URL}/${filename}`;
 *
 * Nothing else in the application changes.
 */
async function putObject(filename: string, _bytes: Buffer, _mimeType: string): Promise<string> {
  const base = process.env.S3_PUBLIC_BASE_URL;
  if (!base) {
    throw new Error(
      'MEDIA_DRIVER=s3 but the S3 driver has not been wired up yet — see src/lib/storage.ts.',
    );
  }
  throw new Error('The S3 driver is not implemented. See the instructions in src/lib/storage.ts.');
}

async function removeObject(_filename: string): Promise<void> {
  throw new Error('The S3 driver is not implemented. See the instructions in src/lib/storage.ts.');
}
