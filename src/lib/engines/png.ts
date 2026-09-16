/**
 * PNG padding engine.
 *
 * Strategy: insert ancillary tEXt chunks immediately before the IEND chunk.
 * tEXt is an ancillary, non-critical chunk — decoders that do not care about
 * textual metadata skip it entirely, and the IDAT pixel data is never touched,
 * so the rendered image is bit-identical to the input.
 *
 * Byte arithmetic per chunk:
 *   4 (length) + 4 (type "tEXt") + data + 4 (CRC) = 12 + data
 *   data = keyword + 0x00 + text, keyword is 1-79 bytes, so data >= 2
 *   smallest chunk = 14 bytes
 *
 * Deltas of 1-13 bytes (only possible when the source is already within 13
 * bytes of the target) are absorbed by growing the previous chunk instead, and
 * when there is no previous chunk the engine reports that the target is too
 * close to the source size to hit exactly.
 *
 * Pure module: no DOM, no network. Unit tested in Node.
 */

import { asciiBytes, concatBytes, crc32, makeFiller, uint32BE } from './bytes';
import { EngineError } from './jpeg';

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const CHUNK_OVERHEAD = 12;
const MIN_CHUNK = CHUNK_OVERHEAD + 2; // keyword(1) + separator(1)
// Cap a single chunk well under the PNG 2^31-1 limit so readers stay happy.
const MAX_CHUNK_DATA = 1024 * 1024;

export function isPng(bytes: Uint8Array): boolean {
  if (bytes.length < 8) return false;
  return PNG_SIGNATURE.every((b, i) => bytes[i] === b);
}

/** Offset of the IEND chunk's 4-byte length field. */
export function pngIendOffset(bytes: Uint8Array): number {
  if (!isPng(bytes)) throw new EngineError('This does not look like a valid PNG file.');
  let offset = 8;
  while (offset + 8 <= bytes.length) {
    const length =
      (bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3];
    const type = String.fromCharCode(
      bytes[offset + 4],
      bytes[offset + 5],
      bytes[offset + 6],
      bytes[offset + 7],
    );
    if (type === 'IEND') return offset;
    if (length < 0) throw new EngineError('Corrupt PNG chunk length.');
    offset += CHUNK_OVERHEAD + length;
  }
  throw new EngineError('PNG file has no IEND chunk — it may be truncated.');
}

/** Build one tEXt chunk whose total on-disk size is exactly `totalBytes`. */
export function buildTextChunk(totalBytes: number, index: number): Uint8Array {
  if (totalBytes < MIN_CHUNK) {
    throw new EngineError(`A PNG text chunk needs at least ${MIN_CHUNK} bytes.`);
  }
  const dataLength = totalBytes - CHUNK_OVERHEAD;
  // Keyword must be 1-79 bytes, Latin-1, no leading/trailing spaces.
  const keyword = `Padding${index}`.slice(0, 79);
  const keywordBytes = asciiBytes(keyword);
  const textLength = dataLength - keywordBytes.length - 1;
  if (textLength < 0) {
    // Fall back to the shortest legal keyword when the chunk is tiny.
    const shortKeyword = asciiBytes('P');
    const shortText = makeFiller(dataLength - shortKeyword.length - 1);
    return assembleChunk('tEXt', concatBytes([shortKeyword, new Uint8Array([0]), shortText]));
  }
  const data = concatBytes([keywordBytes, new Uint8Array([0]), makeFiller(textLength)]);
  return assembleChunk('tEXt', data);
}

function assembleChunk(type: string, data: Uint8Array): Uint8Array {
  const typeBytes = asciiBytes(type);
  const crcInput = concatBytes([typeBytes, data]);
  return concatBytes([uint32BE(data.length), typeBytes, data, uint32BE(crc32(crcInput))]);
}

/** Build a chain of tEXt chunks occupying exactly `totalBytes`. */
export function buildPaddingChunks(totalBytes: number): Uint8Array {
  if (totalBytes === 0) return new Uint8Array(0);
  if (totalBytes < MIN_CHUNK) {
    throw new EngineError(
      `This PNG is within ${MIN_CHUNK} bytes of the target already — pick a slightly larger target.`,
    );
  }
  const chunks: Uint8Array[] = [];
  let remaining = totalBytes;
  let index = 1;
  while (remaining > 0) {
    let size = Math.min(remaining, MAX_CHUNK_DATA + CHUNK_OVERHEAD);
    const leftover = remaining - size;
    if (leftover > 0 && leftover < MIN_CHUNK) {
      size -= MIN_CHUNK - leftover;
    }
    chunks.push(buildTextChunk(size, index));
    remaining -= size;
    index += 1;
  }
  return concatBytes(chunks);
}

/** Pad a PNG to exactly `targetBytes`. */
export function padPng(bytes: Uint8Array, targetBytes: number): Uint8Array {
  const delta = targetBytes - bytes.length;
  if (delta === 0) return bytes.slice();
  if (delta < 0) throw new EngineError('The file is already larger than the target size.');

  const iendAt = pngIendOffset(bytes);
  const out = concatBytes([
    bytes.subarray(0, iendAt),
    buildPaddingChunks(delta),
    bytes.subarray(iendAt),
  ]);

  if (out.length !== targetBytes) {
    throw new EngineError(`Internal padding error: produced ${out.length} of ${targetBytes} bytes.`);
  }
  return out;
}
