#!/usr/bin/env node
// Render the Maintain Technology infographics engine to PNGs + carousel.pdf.
//
//   node .claude/skills/maintain-infographics/scripts/render.mjs [slides.json] [outDir]
//
// Defaults: slides = ../assets/slides.json ; outDir = ./out
// Env: SCALE=2 for 2x-crisp PNGs (default 1 = exact platform pixels).
//
// Needs Playwright Chromium once:  npm i playwright && npx playwright install chromium
// (If Playwright isn't installed, render via the browser tools instead: serve the repo,
//  open the generator, screenshot each .panel, then print-to-PDF at the format size.)

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dir = path.dirname(fileURLToPath(import.meta.url));
const assets = path.resolve(__dir, "../assets");

// 1. locate repo root (nearest ancestor with DESIGN.md)
let root = __dir;
while (root !== path.dirname(root) && !fs.existsSync(path.join(root, "DESIGN.md"))) root = path.dirname(root);
if (!fs.existsSync(path.join(root, "DESIGN.md"))) { console.error("Could not find repo root (no DESIGN.md above the script)."); process.exit(1); }

// 2. args
const slidesPath = path.resolve(process.argv[2] || path.join(assets, "slides.json"));
const outDir = path.resolve(process.argv[3] || path.join(__dir, "out"));
const scale = Number(process.env.SCALE || 1);
if (!fs.existsSync(slidesPath)) { console.error("Slides file not found:", slidesPath); process.exit(1); }
const data = JSON.parse(fs.readFileSync(slidesPath, "utf8"));
const fmt = data.format || { w: 1080, h: 1350 };
fs.mkdirSync(outDir, { recursive: true });

// 3. Playwright (graceful if missing)
let chromium;
try { ({ chromium } = await import("playwright")); }
catch { console.error("\nPlaywright is not installed. Run once:\n  npm i playwright && npx playwright install chromium\n"); process.exit(1); }

// 4. static server at repo root
const MIME = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".ttf": "font/ttf", ".otf": "font/otf", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".svg": "image/svg+xml", ".ico": "image/x-icon" };
const server = http.createServer((req, res) => {
  const fp = path.join(root, decodeURIComponent(req.url.split("?")[0]));
  fs.readFile(fp, (err, buf) => {
    if (err) { res.writeHead(404); res.end("404"); return; }
    res.writeHead(200, { "content-type": MIME[path.extname(fp).toLowerCase()] || "application/octet-stream" });
    res.end(buf);
  });
});
await new Promise(r => server.listen(0, r));
const port = server.address().port;

// URL to the generator, pointing ?src at the (root-relative) slides file
const genUrl = "/" + path.relative(root, path.join(assets, "generator.html")).split(path.sep).map(encodeURIComponent).join("/");
const srcUrl = "/" + path.relative(root, slidesPath).split(path.sep).map(encodeURIComponent).join("/");
const url = `http://localhost:${port}${genUrl}?src=${encodeURIComponent(srcUrl)}`;

// 5. render
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: fmt.w, height: fmt.h }, deviceScaleFactor: scale });
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForSelector("body[data-ready]", { timeout: 20000 });
await page.evaluate(() => document.fonts.ready);

const panels = await page.$$(".panel");
const stamp = path.basename(slidesPath).replace(/\.json$/, "");
let i = 0;
for (const el of panels) {
  i++;
  const file = path.join(outDir, `slide-${i}.png`);
  await el.screenshot({ path: file });
  console.log("  wrote", path.relative(root, file));
}

// 6. carousel PDF (one panel per page, print CSS handles the breaks)
const pdf = path.join(outDir, "carousel.pdf");
await page.pdf({ path: pdf, width: `${fmt.w}px`, height: `${fmt.h}px`, printBackground: true, pageRanges: "" });
console.log("  wrote", path.relative(root, pdf));

await browser.close();
server.close();
console.log(`\nDone. ${panels.length} slide(s) @ ${fmt.w}x${fmt.h}${scale > 1 ? " x" + scale : ""} -> ${path.relative(root, outDir)}/  (${stamp})`);
