/**
 * Mobile and desktop layout check.
 *
 * Loads the key page types at phone and desktop widths, fails on any
 * horizontal overflow, checks that tap targets in the tool are large enough,
 * and writes screenshots for a visual pass.
 */

import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.argv[2] ?? 'http://localhost:3100';
const OUT = process.argv[3] ?? '/tmp/claude-0/screens';
mkdirSync(OUT, { recursive: true });

const PAGES = [
  ['home', '/'],
  ['landing', '/increase-jpg-file-size-to-100kb'],
  ['hub', '/pdf'],
  ['photoshop', '/increase-file-size-in-photoshop'],
  ['blog', '/blog'],
  ['post', '/blog/kb-vs-mb-difference-uploads'],
  ['sizes', '/sizes'],
  ['login', '/admin/login'],
];

const VIEWPORTS = [
  ['mobile', { width: 375, height: 812 }],
  ['desktop', { width: 1280, height: 900 }],
];

let failures = 0;
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
});

for (const [vpName, viewport] of VIEWPORTS) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 2 });
  const page = await context.newPage();

  for (const [name, path] of PAGES) {
    await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });

    const metrics = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      // Anything sticking out past the viewport edge.
      overflowing: Array.from(document.querySelectorAll('body *'))
        .filter((el) => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && (r.right > window.innerWidth + 1 || r.left < -1);
        })
        .slice(0, 3)
        .map((el) => `${el.tagName.toLowerCase()}.${(el.className || '').toString().slice(0, 40)}`),
      smallTapTargets: Array.from(document.querySelectorAll('button, a'))
        .filter((el) => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.height > 0 && r.height < 28;
        })
        .slice(0, 3)
        .map((el) => (el.textContent || '').trim().slice(0, 30)),
    }));

    const overflow = metrics.scrollWidth > metrics.clientWidth + 1;
    const ok = !overflow && metrics.overflowing.length === 0;
    if (!ok) failures += 1;

    console.log(
      `${ok ? 'PASS' : 'FAIL'}  ${vpName.padEnd(7)} ${name.padEnd(10)} ${path}` +
        (ok
          ? ''
          : `\n      scrollWidth ${metrics.scrollWidth} vs ${metrics.clientWidth}; offenders: ${metrics.overflowing.join(', ')}`),
    );
    if (vpName === 'mobile' && metrics.smallTapTargets.length > 0) {
      console.log(`      note: small tap targets — ${metrics.smallTapTargets.join(' | ')}`);
    }

    await page.screenshot({
      path: `${OUT}/${vpName}-${name}.png`,
      fullPage: name === 'landing' || name === 'home',
    });
  }

  await context.close();
}

/* The admin login form is client-rendered (it reads the callbackUrl from the
   query string), so confirm it is actually there after hydration. */
{
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${BASE}/admin/login`, { waitUntil: 'networkidle' });
  const hasPassword = await page.locator('input[type=password]').count();
  const hasEmail = await page.locator('input[type=email]').count();
  const ok = hasPassword === 1 && hasEmail === 1;
  if (!ok) failures += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  admin login form hydrates (email + password fields)`);
  await context.close();
}

await browser.close();
console.log(failures === 0 ? '\nALL LAYOUT CHECKS PASSED' : `\n${failures} LAYOUT FAILURES`);
process.exit(failures === 0 ? 0 : 1);
