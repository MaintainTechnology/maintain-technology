// Download every referenced upload into public/assets, and the site's real
// stylesheets into src/styles/wp. Elementor's generated CSS is the ground truth
// for layout, so we take it verbatim rather than re-deriving it.
//
//   node scripts/fetch-assets.mjs

import fs from 'node:fs';
import path from 'node:path';

const ORIGIN = 'https://maintain.com.au';
const assets = JSON.parse(fs.readFileSync('content/assets.json', 'utf8'));
const pages = JSON.parse(fs.readFileSync('content/pages.json', 'utf8'));
const caseStudies = JSON.parse(fs.readFileSync('content/case-studies.json', 'utf8'));

// Stylesheets we deliberately do NOT take: those belong to plugins we replace.
const CSS_SKIP = [/forminator/i, /wp-includes/i, /godaddy/i, /\/dist\/components\//i];

let ok = 0, fail = 0, skipped = 0;

async function download(url, dest) {
  if (fs.existsSync(dest) && fs.statSync(dest).size > 0) { skipped++; return true; }
  try {
    const res = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 (site-migration)' } });
    if (!res.ok) { console.warn(`  ${res.status} ${url}`); fail++; return false; }
    const buf = Buffer.from(await res.arrayBuffer());
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, buf);
    ok++;
    return true;
  } catch (e) {
    console.warn(`  ERR ${url} :: ${e.message}`);
    fail++;
    return false;
  }
}

// Run n at a time so we don't hammer the origin.
async function pool(items, n, fn) {
  const queue = [...items];
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (queue.length) await fn(queue.shift());
    })
  );
}

// --- 1. media -------------------------------------------------------------
console.log(`[1/3] media: ${Object.keys(assets).length} files`);
await pool(Object.entries(assets), 8, ([remote, local]) =>
  download(remote, path.join('public', local.replace(/^\//, '')))
);
console.log(`      downloaded=${ok} cached=${skipped} failed=${fail}`);

// --- 2. discover stylesheets by crawling the live pages -------------------
const urls = [
  '/',
  ...pages.filter((p) => p.status === 'publish' && p.slug !== 'home').map((p) => `/${p.slug}/`),
  ...caseStudies.map((c) => `/case-study/${c.slug}/`),
];

const sheets = new Set();
const scripts = new Set();
const inlineCss = [];

console.log(`[2/3] crawling ${urls.length} pages for stylesheet graph`);
await pool(urls, 5, async (u) => {
  try {
    const res = await fetch(ORIGIN + u, { headers: { 'user-agent': 'Mozilla/5.0 (site-migration)' } });
    if (!res.ok) { console.warn(`  ${res.status} ${u}`); return; }
    const html = await res.text();
    for (const m of html.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]*href=["']([^"']+)["']/g)) sheets.add(m[1]);
    for (const m of html.matchAll(/<script[^>]+src=["']([^"']+)["']/g)) scripts.add(m[1]);
    // Elementor also inlines critical rules; keep them for reference.
    for (const m of html.matchAll(/<style[^>]*id=["']([^"']*)["'][^>]*>([\s\S]*?)<\/style>/g)) {
      if (m[2].trim().length > 200) inlineCss.push({ page: u, id: m[1], css: m[2] });
    }
    fs.mkdirSync('reference/html', { recursive: true });
    fs.writeFileSync(path.join('reference/html', (u.replace(/\//g, '_') || 'root') + '.html'), html);
  } catch (e) {
    console.warn(`  ERR ${u} :: ${e.message}`);
  }
});
console.log(`      found ${sheets.size} stylesheets, ${scripts.size} scripts`);

// --- 3. download the stylesheets we keep ----------------------------------
const keep = [...sheets].filter((s) => !CSS_SKIP.some((re) => re.test(s)));
console.log(`[3/3] stylesheets: keeping ${keep.length}, skipping ${sheets.size - keep.length} (plugin CSS we replace)`);

ok = 0; fail = 0; skipped = 0;
await pool(keep, 8, async (href) => {
  const url = href.startsWith('http') ? href : ORIGIN + href;
  const clean = url.split('?')[0].replace(/^https?:\/\/[^/]+\//, '');
  await download(url, path.join('src/styles/wp', clean));
});
console.log(`      downloaded=${ok} cached=${skipped} failed=${fail}`);

fs.mkdirSync('reference', { recursive: true });
fs.writeFileSync('reference/stylesheets.json', JSON.stringify({ kept: keep, skipped: [...sheets].filter((s) => CSS_SKIP.some((re) => re.test(s))) }, null, 2));
fs.writeFileSync('reference/scripts.json', JSON.stringify([...scripts], null, 2));
fs.writeFileSync('reference/inline-css.json', JSON.stringify(inlineCss, null, 2));
console.log('done. reference/ holds the live HTML + asset graph for comparison.');
