/**
 * End-to-end verification of the tool in a real browser.
 *
 * For each case it drives the actual UI — picks a file, sets a target, runs the
 * engine, downloads the result — and then asserts:
 *   1. the downloaded file is byte-exactly the requested size
 *   2. the downloaded file is still a valid, openable file (checked by the
 *      companion Python script)
 *   3. NO network request carried the file: every request made while the tool
 *      runs is logged, and any request with a body near the file's size, or any
 *      request to an upload-looking endpoint, fails the run
 *
 * Usage: node scripts/verify-in-browser.mjs [baseUrl] [fixtureDir] [outDir]
 */

import { chromium } from 'playwright';
import { mkdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const BASE = process.argv[2] ?? 'http://localhost:3100';
const FIXTURES = process.argv[3] ?? '/tmp/claude-0/enginetest';
const OUT = process.argv[4] ?? '/tmp/claude-0/browser-out';
mkdirSync(OUT, { recursive: true });

const KB = 1024;
const MB = 1024 * 1024;

const CASES = [
  { name: 'JPG → 100KB (landing page, preset target)', path: '/increase-jpg-file-size-to-100kb', file: 'sample.jpg', expect: 100 * KB },
  { name: 'JPG → 20KB (landing page)', path: '/increase-jpg-file-size-to-20kb', file: 'sample.jpg', expect: 20 * KB },
  { name: 'JPG → 2MB (homepage, custom)', path: '/', file: 'sample.jpg', expect: 2 * MB, custom: { value: '2', unit: 'MB' } },
  { name: 'PNG → 50KB (PNG hub, custom target)', path: '/png', file: 'sample.png', expect: 50 * KB, custom: { value: '50', unit: 'KB' } },
  { name: 'PNG → 1MB (landing page)', path: '/increase-file-size-to-1mb', file: 'sample.png', expect: 1 * MB },
  { name: 'PDF → 200KB (PDF landing page)', path: '/increase-pdf-file-size-to-200kb', file: 'sample.pdf', expect: 200 * KB },
  { name: 'PDF → 1MB (multi-page)', path: '/pdf', file: 'multi.pdf', expect: 1 * MB, custom: { value: '1', unit: 'MB' } },
  { name: 'JPG → 300KB upscale mode (real resolution increase)', path: '/', file: 'sample.jpg', expect: 300 * KB, mode: 'upscale', custom: { value: '300', unit: 'KB' } },
  { name: 'PNG → 500KB upscale mode', path: '/increase-png-file-resolution', file: 'sample.png', expect: 500 * KB, custom: { value: '500', unit: 'KB' } },
];

/** A request is suspicious if it could be carrying the visitor's file. */
function classifyRequest(req, fileSize) {
  const url = req.url();
  const method = req.method();
  if (method === 'GET' || method === 'HEAD') return null;

  const postData = req.postData();
  const bodySize = postData ? Buffer.byteLength(postData) : 0;

  // The analytics beacon is the only expected non-GET: a few hundred bytes of
  // JSON to /api/events. Anything else, or anything large, is a failure.
  const isBeacon = url.endsWith('/api/events') && bodySize < 2048;
  if (isBeacon) return null;

  return `${method} ${url} (${bodySize} bytes)`;
}

let failures = 0;
const results = [];

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const context = await browser.newContext({ acceptDownloads: true });

for (const testCase of CASES) {
  const page = await context.newPage();
  const sourceSize = statSync(join(FIXTURES, testCase.file)).size;
  const suspicious = [];
  const allRequests = [];

  page.on('request', (req) => {
    allRequests.push(`${req.method()} ${req.url()}`);
    const problem = classifyRequest(req, sourceSize);
    if (problem) suspicious.push(problem);
  });

  const consoleErrors = [];
  page.on('pageerror', (err) => consoleErrors.push(err.message));

  try {
    await page.goto(`${BASE}${testCase.path}`, { waitUntil: 'networkidle' });

    // Pick the file through the real input element.
    await page.setInputFiles('input[type=file]', join(FIXTURES, testCase.file));

    // Set the target size.
    if (testCase.custom) {
      await page.selectOption('select#\\:r0\\:-size, select[id$="-size"]', 'custom');
      await page.fill('input[id$="-custom"]', testCase.custom.value);
      await page.selectOption('select[aria-label="Unit"]', testCase.custom.unit);
    }

    if (testCase.mode === 'upscale') {
      await page.getByRole('button', { name: 'Increase resolution' }).click();
    }

    // Run it.
    const runButton = page.getByRole('button', { name: /^Increase to/ });
    await runButton.click();

    // Wait for the result panel and download.
    const downloadLink = page.getByRole('link', { name: /^Download / });
    await downloadLink.waitFor({ state: 'visible', timeout: 60_000 });

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      downloadLink.click(),
    ]);

    const savedAs = join(OUT, `${testCase.expect}-${download.suggestedFilename()}`);
    await download.saveAs(savedAs);
    const actual = statSync(savedAs).size;

    const sizeOk = actual === testCase.expect;
    const networkOk = suspicious.length === 0;
    const noErrors = consoleErrors.length === 0;

    if (!sizeOk || !networkOk || !noErrors) failures += 1;

    results.push({
      name: testCase.name,
      sizeOk,
      networkOk,
      noErrors,
      actual,
      expected: testCase.expect,
      savedAs,
      suspicious,
      consoleErrors,
      requestCount: allRequests.length,
    });

    console.log(
      `${sizeOk && networkOk && noErrors ? 'PASS' : 'FAIL'}  ${testCase.name}\n` +
        `      size: ${actual} bytes (wanted ${testCase.expect})\n` +
        `      network during run: ${networkOk ? 'no file-bearing requests' : suspicious.join(', ')}` +
        (noErrors ? '' : `\n      page errors: ${consoleErrors.join('; ')}`),
    );
  } catch (error) {
    failures += 1;
    console.log(`FAIL  ${testCase.name}\n      ${error.message.split('\n')[0]}`);
    results.push({ name: testCase.name, error: error.message });
  } finally {
    await page.close();
  }
}

/* ---- offline test: the strongest proof there is no upload ---- */
console.log('\nOffline test (page loaded, then network disabled):');
{
  const page = await context.newPage();
  try {
    await page.goto(`${BASE}/increase-jpg-file-size-to-100kb`, { waitUntil: 'networkidle' });
    await context.setOffline(true);
    await page.setInputFiles('input[type=file]', join(FIXTURES, 'sample.jpg'));
    await page.getByRole('button', { name: /^Increase to/ }).click();
    const link = page.getByRole('link', { name: /^Download / });
    await link.waitFor({ state: 'visible', timeout: 30_000 });
    const [download] = await Promise.all([page.waitForEvent('download'), link.click()]);
    const savedAs = join(OUT, `offline-${download.suggestedFilename()}`);
    await download.saveAs(savedAs);
    const size = statSync(savedAs).size;
    const ok = size === 100 * 1024;
    if (!ok) failures += 1;
    console.log(`${ok ? 'PASS' : 'FAIL'}  tool works with the network switched off — ${size} bytes`);
  } catch (error) {
    failures += 1;
    console.log(`FAIL  offline test: ${error.message.split('\n')[0]}`);
  } finally {
    await context.setOffline(false);
    await page.close();
  }
}

await browser.close();

console.log(failures === 0 ? '\nALL BROWSER CHECKS PASSED' : `\n${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
