/**
 * PDF padding engine (pdf-lib, runs entirely in the browser).
 *
 * Strategy: attach one inert stream object to the document catalog under a
 * private key. The stream is a valid, referenced PDF object, so the file stays
 * structurally sound and passes validators, but no page, font or annotation
 * points at it — nothing about the rendered document changes.
 *
 * Because pdf-lib rewrites the cross-reference table on every save, the exact
 * output size is not known until after a save. The engine therefore measures,
 * adjusts the filler length, and re-saves (a handful of iterations at most).
 * Any final 1-3 byte residual is absorbed by a comment appended after the
 * trailing %%EOF, which PDF readers ignore.
 */

import type { PDFDict } from 'pdf-lib';
import { asciiBytes, concatBytes, makeFiller } from './bytes';
import { EngineError } from './jpeg';

/**
 * pdf-lib is the heaviest dependency on the site, and most visitors are here
 * for a JPG or PNG. Loading it on demand keeps it out of the initial bundle of
 * every page, so the tool is interactive sooner.
 */
const loadPdfLib = () => import('pdf-lib');

const PADDING_KEY = 'IFSPaddingData';
const MAX_PASSES = 8;

async function buildPadded(source: Uint8Array, fillerLength: number): Promise<Uint8Array> {
  const { PDFDocument, PDFName, PDFRawStream } = await loadPdfLib();
  const pdfDoc = await PDFDocument.load(source, { ignoreEncryption: true, updateMetadata: false });

  if (fillerLength > 0) {
    const filler = makeFiller(fillerLength);
    const dict = pdfDoc.context.obj({
      Type: PDFName.of('IFSPadding'),
      Length: filler.length,
    }) as PDFDict;
    const stream = PDFRawStream.of(dict, filler);
    const ref = pdfDoc.context.register(stream);
    // Referenced from the catalog under a private key so the object is not an
    // orphan; readers ignore catalog keys they do not recognise.
    pdfDoc.catalog.set(PDFName.of(PADDING_KEY), ref);
  }

  const saved = await pdfDoc.save({ useObjectStreams: false });
  return new Uint8Array(saved);
}

/** Bytes appended after %%EOF to absorb a tiny residual. */
function trailingComment(delta: number): Uint8Array {
  if (delta <= 0) return new Uint8Array(0);
  if (delta === 1) return asciiBytes('\n');
  if (delta === 2) return asciiBytes('\n\n');
  // "\n%" + filler + "\n" — a PDF comment, terminated by the newline.
  return concatBytes([asciiBytes('\n%'), makeFiller(delta - 3), asciiBytes('\n')]);
}

/**
 * Pad a PDF to exactly `targetBytes`.
 *
 * Note: a rebuilt PDF is not byte-identical to its source even with zero
 * filler, so when the target is very close to (or below) the rebuilt baseline
 * the engine reports that rather than silently overshooting.
 */
export async function padPdf(source: Uint8Array, targetBytes: number): Promise<Uint8Array> {
  const baseline = await buildPadded(source, 0);
  if (baseline.length > targetBytes) {
    throw new EngineError(
      'This PDF is already at or above the target size — this tool only increases file size.',
    );
  }

  let fillerLength = Math.max(0, targetBytes - baseline.length - 40);
  let out = baseline;

  for (let pass = 0; pass < MAX_PASSES; pass += 1) {
    out = fillerLength === 0 ? baseline : await buildPadded(source, fillerLength);
    const delta = targetBytes - out.length;

    if (delta === 0) return out;
    if (delta > 0 && delta <= 3) return concatBytes([out, trailingComment(delta)]);
    if (delta > 0) {
      fillerLength += delta;
      continue;
    }
    // Overshot — back the filler off by the overshoot plus a small margin.
    const reduction = Math.min(fillerLength, -delta + 4);
    if (reduction === 0) break;
    fillerLength -= reduction;
  }

  // Final safety net: top up whatever is left with a trailing comment.
  const remaining = targetBytes - out.length;
  if (remaining < 0) {
    throw new EngineError('Could not hit the exact target size for this PDF — try a larger target.');
  }
  const padded = remaining === 0 ? out : concatBytes([out, trailingComment(remaining)]);
  if (padded.length !== targetBytes) {
    throw new EngineError(`Internal padding error: produced ${padded.length} of ${targetBytes} bytes.`);
  }
  return padded;
}
