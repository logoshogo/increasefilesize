/**
 * Shared byte utilities for the client-side file engines.
 *
 * Everything in this module is pure (no DOM, no network) so it can be unit
 * tested in Node and reused by every format engine.
 */

export const KB = 1024;
export const MB = 1024 * 1024;

/** Filler payload is plain printable ASCII so it is inert in every container. */
const FILLER_ALPHABET =
  'increasefilesize.com padding block. This data is inert and does not affect how the file renders. ';

/**
 * Build `length` bytes of deterministic, printable ASCII filler.
 * Deterministic output keeps results reproducible and makes tests meaningful.
 */
export function makeFiller(length: number): Uint8Array {
  const out = new Uint8Array(Math.max(0, length));
  if (out.length === 0) return out;
  const seed = FILLER_ALPHABET;
  for (let i = 0; i < out.length; i += 1) {
    out[i] = seed.charCodeAt(i % seed.length);
  }
  return out;
}

export function concatBytes(chunks: Uint8Array[]): Uint8Array {
  let total = 0;
  for (const c of chunks) total += c.length;
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out;
}

/**
 * Copy bytes into a plain ArrayBuffer for Blob construction.
 * TypeScript's newer DOM lib rejects a Uint8Array backed by an
 * ArrayBufferLike, so this narrows it explicitly.
 */
export function toBlobPart(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

export function asciiBytes(text: string): Uint8Array {
  const out = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i += 1) out[i] = text.charCodeAt(i) & 0xff;
  return out;
}

/* ------------------------------------------------------------------ */
/* CRC-32 (PNG chunk checksums)                                        */
/* ------------------------------------------------------------------ */

let crcTable: Uint32Array | null = null;

function getCrcTable(): Uint32Array {
  if (crcTable) return crcTable;
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  crcTable = table;
  return table;
}

export function crc32(bytes: Uint8Array): number {
  const table = getCrcTable();
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) {
    c = table[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

export function uint32BE(value: number): Uint8Array {
  const out = new Uint8Array(4);
  out[0] = (value >>> 24) & 0xff;
  out[1] = (value >>> 16) & 0xff;
  out[2] = (value >>> 8) & 0xff;
  out[3] = value & 0xff;
  return out;
}

/* ------------------------------------------------------------------ */
/* Human-facing size formatting / parsing                              */
/* ------------------------------------------------------------------ */

export function formatBytes(bytes: number): string {
  if (bytes < KB) return `${bytes} B`;
  if (bytes < MB) {
    const kb = bytes / KB;
    return `${kb % 1 === 0 ? kb : kb.toFixed(1)} KB`;
  }
  const mb = bytes / MB;
  return `${mb % 1 === 0 ? mb : mb.toFixed(2)} MB`;
}

/**
 * Parse a user-entered target like "100", "100kb", "1.5 MB" into bytes.
 * `unit` is used when the string carries no unit of its own.
 */
export function parseTargetSize(input: string, unit: 'KB' | 'MB' = 'KB'): number | null {
  const trimmed = input.trim().toLowerCase().replace(/,/g, '');
  if (!trimmed) return null;
  const match = trimmed.match(/^([0-9]*\.?[0-9]+)\s*(kb|mb|k|m|b)?$/);
  if (!match) return null;
  const value = Number.parseFloat(match[1]);
  if (!Number.isFinite(value) || value <= 0) return null;
  const suffix = match[2];
  if (suffix === 'b') return Math.round(value);
  if (suffix === 'kb' || suffix === 'k') return Math.round(value * KB);
  if (suffix === 'mb' || suffix === 'm') return Math.round(value * MB);
  return Math.round(value * (unit === 'MB' ? MB : KB));
}

/** Detect format from the file's magic bytes rather than trusting the extension. */
export function sniffFormat(bytes: Uint8Array): 'jpg' | 'png' | 'pdf' | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpg';
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return 'png';
  }
  if (bytes.length >= 5 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
    return 'pdf';
  }
  return null;
}
