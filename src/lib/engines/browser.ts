/**
 * Browser-side orchestration for the file engines.
 *
 * IMPORTANT: every function here runs in the visitor's browser. There is no
 * fetch/XHR/WebSocket call anywhere in this module or anything it imports —
 * the file the visitor picks is read with the File API, transformed in memory,
 * and handed back as a Blob for download. Nothing is ever uploaded.
 */

import { EngineError, padJpeg } from './jpeg';
import { padPng } from './png';
import { padPdf } from './pdf';
import { formatBytes, sniffFormat, toBlobPart } from './bytes';

export type FileFormat = 'jpg' | 'png' | 'pdf';
export type EngineMode = 'pad' | 'upscale';

export interface ProcessResult {
  blob: Blob;
  filename: string;
  originalSize: number;
  finalSize: number;
  format: FileFormat;
  mode: EngineMode;
  /** Set when the image was genuinely resized rather than only padded. */
  newDimensions?: { width: number; height: number };
  originalDimensions?: { width: number; height: number };
  notes: string[];
}

export interface ProcessOptions {
  targetBytes: number;
  mode: EngineMode;
}

const MIME: Record<FileFormat, string> = {
  jpg: 'image/jpeg',
  png: 'image/png',
  pdf: 'application/pdf',
};

export async function readFileBytes(file: File): Promise<Uint8Array> {
  const buffer = await file.arrayBuffer();
  return new Uint8Array(buffer);
}

export function detectFormat(file: File, bytes: Uint8Array): FileFormat {
  const sniffed = sniffFormat(bytes);
  if (sniffed) return sniffed;
  const name = file.name.toLowerCase();
  if (name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'jpg';
  if (name.endsWith('.png')) return 'png';
  if (name.endsWith('.pdf')) return 'pdf';
  throw new EngineError('Unsupported file type. This tool works with JPG, PNG and PDF files.');
}

/* ------------------------------------------------------------------ */
/* Canvas helpers (only used for re-encoding and genuine upscaling)     */
/* ------------------------------------------------------------------ */

async function loadImage(bytes: Uint8Array, format: FileFormat): Promise<HTMLImageElement> {
  const blob = new Blob([toBlobPart(bytes)], { type: MIME[format] });
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.decoding = 'sync';
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new EngineError('This image could not be read by your browser.'));
      img.src = url;
    });
    return img;
  } finally {
    // The element keeps its decoded copy; the object URL can go.
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

function drawToCanvas(img: HTMLImageElement, width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new EngineError('Your browser blocked canvas access, so the image cannot be resized.');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}

async function canvasToBytes(
  canvas: HTMLCanvasElement,
  format: FileFormat,
  quality?: number,
): Promise<Uint8Array> {
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), MIME[format], quality),
  );
  if (!blob) throw new EngineError('Your browser could not re-encode this image.');
  return new Uint8Array(await blob.arrayBuffer());
}

/* ------------------------------------------------------------------ */
/* Shrink-to-fit (only when the source already exceeds the target)      */
/* ------------------------------------------------------------------ */

async function shrinkJpegBelow(
  img: HTMLImageElement,
  ceiling: number,
): Promise<{ bytes: Uint8Array; width: number; height: number }> {
  // Try quality first — it preserves dimensions.
  let low = 0.2;
  let high = 0.95;
  let best: Uint8Array | null = null;
  const canvas = drawToCanvas(img, img.naturalWidth, img.naturalHeight);
  for (let i = 0; i < 8; i += 1) {
    const q = (low + high) / 2;
    const out = await canvasToBytes(canvas, 'jpg', q);
    if (out.length <= ceiling) {
      best = out;
      low = q;
    } else {
      high = q;
    }
  }
  if (best) return { bytes: best, width: canvas.width, height: canvas.height };

  // Still too big at low quality — scale the pixels down.
  let scale = 0.9;
  for (let i = 0; i < 10 && scale > 0.05; i += 1) {
    const scaled = drawToCanvas(img, img.naturalWidth * scale, img.naturalHeight * scale);
    const out = await canvasToBytes(scaled, 'jpg', 0.6);
    if (out.length <= ceiling) return { bytes: out, width: scaled.width, height: scaled.height };
    scale *= 0.8;
  }
  throw new EngineError('This image cannot be reduced to the requested target size.');
}

async function shrinkPngBelow(
  img: HTMLImageElement,
  ceiling: number,
): Promise<{ bytes: Uint8Array; width: number; height: number }> {
  let scale = 1;
  for (let i = 0; i < 12 && scale > 0.03; i += 1) {
    const canvas = drawToCanvas(img, img.naturalWidth * scale, img.naturalHeight * scale);
    const out = await canvasToBytes(canvas, 'png');
    if (out.length <= ceiling) return { bytes: out, width: canvas.width, height: canvas.height };
    scale *= 0.75;
  }
  throw new EngineError('This image cannot be reduced to the requested target size.');
}

/* ------------------------------------------------------------------ */
/* Genuine upscale (real resolution increase, then exact padding)       */
/* ------------------------------------------------------------------ */

const MAX_UPSCALE = 8;
const MAX_CANVAS_PIXELS = 40_000_000; // keep well inside mobile Safari's limits

async function upscaleToTarget(
  img: HTMLImageElement,
  format: FileFormat,
  targetBytes: number,
  headroom: number,
): Promise<{ bytes: Uint8Array; width: number; height: number }> {
  const ceiling = targetBytes - headroom;
  const baseW = img.naturalWidth;
  const baseH = img.naturalHeight;
  let scale = 2;
  let best: { bytes: Uint8Array; width: number; height: number } | null = null;

  for (let i = 0; i < 7; i += 1) {
    const clamped = Math.min(
      MAX_UPSCALE,
      Math.max(1, Math.min(scale, Math.sqrt(MAX_CANVAS_PIXELS / (baseW * baseH)))),
    );
    const canvas = drawToCanvas(img, baseW * clamped, baseH * clamped);
    const bytes = await canvasToBytes(canvas, format, format === 'jpg' ? 0.95 : undefined);

    if (bytes.length <= ceiling) {
      if (!best || bytes.length > best.bytes.length) {
        best = { bytes, width: canvas.width, height: canvas.height };
      }
      // Close enough to the target that padding will be a thin top-up.
      if (bytes.length >= ceiling * 0.85) break;
      if (clamped >= MAX_UPSCALE || clamped * baseW * clamped * baseH >= MAX_CANVAS_PIXELS) break;
      scale = clamped * Math.min(2, Math.sqrt(ceiling / Math.max(1, bytes.length)));
    } else {
      scale = clamped * Math.sqrt(ceiling / bytes.length) * 0.95;
      if (scale <= 1) break;
    }
  }

  if (best) return best;
  // Upscaling always overshot the target — fall back to the original pixels.
  const canvas = drawToCanvas(img, baseW, baseH);
  const bytes = await canvasToBytes(canvas, format, format === 'jpg' ? 0.92 : undefined);
  if (bytes.length > ceiling) {
    throw new EngineError(
      'The target size is too small to increase this image’s resolution. Try "pad file size" instead.',
    );
  }
  return { bytes, width: canvas.width, height: canvas.height };
}

/* ------------------------------------------------------------------ */
/* Public entry point                                                   */
/* ------------------------------------------------------------------ */

const JPEG_HEADROOM = 5; // smallest COM segment
const PNG_HEADROOM = 14; // smallest tEXt chunk

export function outputFilename(original: string, format: FileFormat, targetBytes: number): string {
  const base = original.replace(/\.[^.]+$/, '') || 'file';
  const ext = format === 'jpg' ? 'jpg' : format;
  const label = formatBytes(targetBytes).replace(/\s+/g, '').toLowerCase();
  return `${base}-${label}.${ext}`;
}

export async function processFile(file: File, options: ProcessOptions): Promise<ProcessResult> {
  const { targetBytes, mode } = options;
  if (!Number.isFinite(targetBytes) || targetBytes <= 0) {
    throw new EngineError('Choose a target size first.');
  }

  const bytes = await readFileBytes(file);
  const format = detectFormat(file, bytes);
  const notes: string[] = [];

  if (format === 'pdf') {
    if (mode === 'upscale') {
      notes.push('Resolution upscaling only applies to images — this PDF was padded to the exact size.');
    }
    const out = await padPdf(bytes, targetBytes);
    return {
      blob: new Blob([toBlobPart(out)], { type: MIME.pdf }),
      filename: outputFilename(file.name, 'pdf', targetBytes),
      originalSize: bytes.length,
      finalSize: out.length,
      format,
      mode: 'pad',
      notes,
    };
  }

  const headroom = format === 'jpg' ? JPEG_HEADROOM : PNG_HEADROOM;
  const pad = format === 'jpg' ? padJpeg : padPng;

  let working = bytes;
  let originalDimensions: { width: number; height: number } | undefined;
  let newDimensions: { width: number; height: number } | undefined;

  if (mode === 'upscale') {
    const img = await loadImage(bytes, format);
    originalDimensions = { width: img.naturalWidth, height: img.naturalHeight };
    const up = await upscaleToTarget(img, format, targetBytes, headroom);
    working = up.bytes;
    newDimensions = { width: up.width, height: up.height };
    if (up.width > img.naturalWidth) {
      notes.push(
        `Resolution increased from ${img.naturalWidth}×${img.naturalHeight} to ${up.width}×${up.height}.`,
      );
    } else {
      notes.push('The target size left no room to increase resolution, so the original pixels were kept.');
    }
  } else if (bytes.length > targetBytes - headroom) {
    // Pad mode, but the source is already at or near the target: it has to be
    // re-encoded smaller first, which is the only path in this tool that can
    // change how the file looks.
    if (bytes.length <= targetBytes) {
      throw new EngineError(
        `This file is already ${formatBytes(bytes.length)} — within ${headroom} bytes of the target. Pick a slightly larger target size.`,
      );
    }
    const img = await loadImage(bytes, format);
    originalDimensions = { width: img.naturalWidth, height: img.naturalHeight };
    const ceiling = targetBytes - headroom;
    const shrunk =
      format === 'jpg' ? await shrinkJpegBelow(img, ceiling) : await shrinkPngBelow(img, ceiling);
    working = shrunk.bytes;
    newDimensions = { width: shrunk.width, height: shrunk.height };
    notes.push(
      `The original was larger than ${formatBytes(targetBytes)}, so it was re-encoded down first and then padded to the exact target.`,
    );
  }

  const out = pad(working, targetBytes);
  return {
    blob: new Blob([toBlobPart(out)], { type: MIME[format] }),
    filename: outputFilename(file.name, format, targetBytes),
    originalSize: bytes.length,
    finalSize: out.length,
    format,
    mode,
    originalDimensions,
    newDimensions,
    notes,
  };
}

export { EngineError };
