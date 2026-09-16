/**
 * Engine test harness.
 *
 * Runs the pure padding engines over real sample files and asserts:
 *   1. the output is byte-exactly the requested size
 *   2. the output is still a valid, openable file
 *   3. (images) the decoded pixels are unchanged from the source
 *
 * Pixel and validity checks are done by the companion Python script, which
 * uses Pillow; this file writes the outputs and checks sizes.
 *
 *   npx tsx scripts/test-engines.ts <fixtureDir> <outDir>
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { padJpeg } from '../src/lib/engines/jpeg';
import { padPng } from '../src/lib/engines/png';
import { padPdf } from '../src/lib/engines/pdf';
import { KB, MB } from '../src/lib/engines/bytes';

const fixtures = process.argv[2] ?? '/tmp/claude-0/enginetest';
const outDir = process.argv[3] ?? '/tmp/claude-0/enginetest/out';
mkdirSync(outDir, { recursive: true });

let failures = 0;

function check(name: string, actual: number, expected: number) {
  if (actual === expected) {
    console.log(`  PASS ${name}: exactly ${actual} bytes`);
  } else {
    failures += 1;
    console.log(`  FAIL ${name}: got ${actual}, wanted ${expected}`);
  }
}

const targets = [
  10 * KB,
  20 * KB,
  30 * KB,
  50 * KB,
  60 * KB,
  80 * KB,
  100 * KB,
  150 * KB,
  200 * KB,
  1 * MB,
  2 * MB,
];

async function main() {
  console.log('JPEG');
  const jpg = new Uint8Array(readFileSync(join(fixtures, 'sample.jpg')));
  for (const t of targets.filter((t) => t > jpg.length)) {
    const out = padJpeg(jpg, t);
    writeFileSync(join(outDir, `jpg-${t}.jpg`), out);
    check(`jpg -> ${t}`, out.length, t);
  }
  // Awkward deltas that cannot form a COM segment.
  for (const delta of [1, 2, 3, 4, 5, 6, 13, 65535, 65536, 65537, 131072]) {
    const t = jpg.length + delta;
    const out = padJpeg(jpg, t);
    writeFileSync(join(outDir, `jpg-delta-${delta}.jpg`), out);
    check(`jpg +${delta}`, out.length, t);
  }

  console.log('PNG');
  const png = new Uint8Array(readFileSync(join(fixtures, 'sample.png')));
  for (const t of targets) {
    const out = padPng(png, t);
    writeFileSync(join(outDir, `png-${t}.png`), out);
    check(`png -> ${t}`, out.length, t);
  }
  for (const delta of [14, 15, 16, 27, 28, 29, 1048588, 2097152]) {
    const t = png.length + delta;
    const out = padPng(png, t);
    writeFileSync(join(outDir, `png-delta-${delta}.png`), out);
    check(`png +${delta}`, out.length, t);
  }

  console.log('PDF');
  for (const fixture of ['sample.pdf', 'multi.pdf']) {
    const pdf = new Uint8Array(readFileSync(join(fixtures, fixture)));
    for (const t of [50 * KB, 100 * KB, 200 * KB, 1 * MB, 2 * MB]) {
      const out = await padPdf(pdf, t);
      writeFileSync(join(outDir, `${fixture.replace('.pdf', '')}-${t}.pdf`), out);
      check(`${fixture} -> ${t}`, out.length, t);
    }
    // A target only a little above the source, where the residual path matters.
    for (const delta of [1000, 1001, 1002, 1003]) {
      const t = pdf.length + delta;
      const out = await padPdf(pdf, t);
      writeFileSync(join(outDir, `${fixture.replace('.pdf', '')}-d${delta}.pdf`), out);
      check(`${fixture} +${delta}`, out.length, t);
    }
  }

  console.log(failures === 0 ? '\nALL SIZE CHECKS PASSED' : `\n${failures} FAILURES`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
