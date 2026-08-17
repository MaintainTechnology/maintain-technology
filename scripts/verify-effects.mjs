// Playwright gate for the animation/effects layer (Effects.jsx + app.css).
// Asserts the behaviours README/DESIGN.md promise: circle scrub pinned and
// interpolating, split-text reveals firing, scroll reveals completing, popup
// opening/closing, sticky header, and no page errors on any route.
//
//   npm run dev -- -p 3210        (or any server)
//   node scripts/verify-effects.mjs [baseURL]     default http://localhost:3210
//
// Exits 1 on any failed assertion. Screenshots go to .verify-shots/.

import fs from 'node:fs';
import { chromium } from 'playwright';

const BASE = process.argv[2] || 'http://localhost:3210';
const SHOTS = '.verify-shots';
fs.mkdirSync(SHOTS, { recursive: true });

const ROUTES = [
  '/', '/why-maintain', '/what-we-do', '/who-we-are', '/case-studies', '/careers',
  '/contact', '/the-maintain-promise', '/strikeforce-newsletter', '/test-page',
  '/privacy-policy', '/terms-of-use', '/thank-you',
  '/case-study/from-140-legacy-apps-to-one-unified-platform',
];
// Broken on the live site too; not regressions.
const KNOWN_404 = /HoE_bg-1024x\d+\.jpg|phone-bold-1\.svg/;

let failures = 0;
const check = (ok, label) => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}`);
  if (!ok) failures++;
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
let pageErrs = [], badRequests = [];
page.on('pageerror', (e) => pageErrs.push(String(e).slice(0, 150)));
page.on('response', (r) => {
  if (r.status() >= 400 && !KNOWN_404.test(r.url())) badRequests.push(`${r.status()} ${r.url()}`.slice(0, 120));
});

// --- per-route sweep: reveals fire, nothing stays hidden, no errors ---------
for (const route of ROUTES) {
  pageErrs = []; badRequests = [];
  await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 90000 });
  await page.waitForTimeout(600);
  const total = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y <= total; y += 500) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(80);
  }
  await page.waitForTimeout(500);

  const s = await page.evaluate(() => ({
    fxReveal: document.querySelectorAll('.fx-reveal').length,
    inView: document.querySelectorAll('.fx-reveal.in-view').length,
    splits: document.querySelectorAll('[data-split]').length,
    splitsRevealed: document.querySelectorAll('[data-split].is-revealed').length,
  }));
  check(s.fxReveal === s.inView, `${route} scroll reveals ${s.inView}/${s.fxReveal}`);
  check(s.splits === s.splitsRevealed, `${route} split-text reveals ${s.splitsRevealed}/${s.splits}`);
  check(pageErrs.length === 0, `${route} no page errors${pageErrs.length ? ': ' + pageErrs[0] : ''}`);
  check(badRequests.length === 0, `${route} no unexpected 4xx/5xx${badRequests.length ? ': ' + badRequests[0] : ''}`);
}

// --- circle scrub (home): pinned + interpolating ----------------------------
await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 90000 });
await page.waitForTimeout(800);
const wrapY = await page.evaluate(() => {
  const w = document.querySelector('.sticky_circle_wrap')?.getBoundingClientRect();
  return w ? { top: w.top + scrollY, height: w.height } : null;
});
check(!!wrapY, 'home has .sticky_circle_wrap');
if (wrapY) {
  const widths = [];
  for (const frac of [0.1, 0.5, 0.9]) {
    await page.evaluate((y) => window.scrollTo(0, y), wrapY.top + (wrapY.height - 900) * frac);
    await page.waitForTimeout(800);
    const st = await page.evaluate(() => ({
      pinnedTop: Math.round(document.querySelector('.sticky_circle_wrap > .e-con').getBoundingClientRect().top),
      w: Math.round(document.querySelector('.circle').getBoundingClientRect().width),
    }));
    // Live pins with Elementor sticky_offset:100 — the circle hangs just below
    // the fixed header, expanding from the navbar's bottom edge.
    check(st.pinnedTop === 100, `circle pinned at ${frac} (top=${st.pinnedTop})`);
    widths.push(st.w);
    await page.screenshot({ path: `${SHOTS}/circle-${frac}.png` });
  }
  check(widths[0] < widths[1] && widths[1] < widths[2], `circle grows ${widths.join(' -> ')}`);
}

// --- sticky header ----------------------------------------------------------
await page.evaluate(() => window.scrollTo(0, 400));
await page.waitForTimeout(400);
check(
  await page.evaluate(() => !!document.querySelector('.elementor-location-header .header')?.classList.contains('elementor-sticky--effects')),
  'sticky header engages past 100px'
);

// --- popup (hamburger is <=1024px) ------------------------------------------
await page.setViewportSize({ width: 900, height: 900 });
await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 90000 });
await page.waitForTimeout(800);
const t = await page.evaluate(() => {
  const el = document.querySelector('a[href^="#popup-"]');
  const r = el?.getBoundingClientRect();
  return r && r.width ? { x: r.x + r.width / 2, y: r.y + r.height / 2 } : null;
});
check(!!t, 'popup trigger visible at 900px');
if (t) {
  await page.mouse.click(t.x, t.y);
  await page.waitForTimeout(600);
  check(
    await page.evaluate(() => document.querySelector('.elementor-location-popup')?.classList.contains('is-open')),
    'popup opens'
  );
  await page.screenshot({ path: `${SHOTS}/popup.png` });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  check(
    await page.evaluate(() => !document.querySelector('.elementor-location-popup')?.classList.contains('is-open')),
    'popup closes on Escape'
  );
}

await browser.close();
console.log(failures ? `\n${failures} FAILURE(S)` : '\nall effects verified');
process.exit(failures ? 1 : 0);
