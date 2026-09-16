/**
 * JPEG padding engine.
 *
 * Strategy: insert one or more COM (comment, 0xFFFE) marker segments into the
 * file header, after the SOI and after any leading APPn segments (so JFIF/Exif
 * structure is left untouched). A COM segment is ignored by every decoder, so
 * the decoded pixels are bit-identical to the input — the image cannot look
 * different, because not one byte of entropy-coded scan data is touched.
 *
 * Byte arithmetic:
 *   segment = FF FE <2-byte length> <payload>
 *   length  = payload + 2, max 65535, so payload max 65533
 *   smallest useful segment = 5 bytes (1 byte of payload)
 *
 * That makes every delta >= 5 reachable exactly. A residual of 1-4 bytes
 * (only possible when the source is already within 4 bytes of the target) is
 * appended after the EOI marker instead, which decoders also ignore.
 *
 * Pure module: no DOM, no network. Unit tested in Node.
 */

import { asciiBytes, concatBytes, makeFiller } from './bytes';

const MAX_COM_PAYLOAD = 65533;
const MIN_SEGMENT = 5; // FF FE + 2 length bytes + 1 payload byte

export class EngineError extends Error {}

/** Find the byte offset where it is safe to insert extra marker segments. */
export function jpegInsertOffset(bytes: Uint8Array): number {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    throw new EngineError('This does not look like a valid JPG file.');
  }
  let offset = 2; // past SOI
  // Skip leading APPn segments (FFE0-FFEF) so JFIF's "APP0 first" rule and any
  // Exif block keep their position.
  while (offset + 4 <= bytes.length && bytes[offset] === 0xff) {
    const marker = bytes[offset + 1];
    const isAppn = marker >= 0xe0 && marker <= 0xef;
    if (!isAppn) break;
    const length = (bytes[offset + 2] << 8) | bytes[offset + 3];
    if (length < 2) break;
    offset += 2 + length;
  }
  return Math.min(offset, bytes.length);
}

/** Build a chain of COM segments that together occupy exactly `totalBytes`. */
export function buildComSegments(totalBytes: number): Uint8Array {
  if (totalBytes === 0) return new Uint8Array(0);
  if (totalBytes < MIN_SEGMENT) {
    throw new EngineError(`COM padding needs at least ${MIN_SEGMENT} bytes.`);
  }

  const segments: Uint8Array[] = [];
  let remaining = totalBytes;

  while (remaining > 0) {
    // Never leave a remainder too small to form its own segment.
    let payload = Math.min(remaining - 4, MAX_COM_PAYLOAD);
    const leftover = remaining - (payload + 4);
    if (leftover > 0 && leftover < MIN_SEGMENT) {
      payload -= MIN_SEGMENT - leftover;
    }
    if (payload < 1) {
      throw new EngineError('Unable to split padding into valid JPG segments.');
    }
    const length = payload + 2;
    const header = new Uint8Array([0xff, 0xfe, (length >> 8) & 0xff, length & 0xff]);
    segments.push(header, makeFiller(payload));
    remaining -= payload + 4;
  }

  return concatBytes(segments);
}

/**
 * Pad a JPEG to exactly `targetBytes`.
 * Throws if the source is already at or above the target.
 */
export function padJpeg(bytes: Uint8Array, targetBytes: number): Uint8Array {
  const delta = targetBytes - bytes.length;
  if (delta === 0) return bytes.slice();
  if (delta < 0) {
    throw new EngineError('The file is already larger than the target size.');
  }

  const insertAt = jpegInsertOffset(bytes);
  const head = bytes.subarray(0, insertAt);
  const tail = bytes.subarray(insertAt);

  // Deltas of 1-4 bytes cannot form a COM segment; park them after EOI.
  const trailing = delta < MIN_SEGMENT ? delta : 0;
  const inSegments = delta - trailing;

  const parts: Uint8Array[] = [head];
  if (inSegments > 0) parts.push(buildComSegments(inSegments));
  parts.push(tail);
  if (trailing > 0) parts.push(asciiBytes('\n'.repeat(trailing)));

  const out = concatBytes(parts);
  if (out.length !== targetBytes) {
    throw new EngineError(`Internal padding error: produced ${out.length} of ${targetBytes} bytes.`);
  }
  return out;
}
