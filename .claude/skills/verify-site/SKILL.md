---
name: verify-site
description: Verify this site's pages, animations, and live-site parity in a real browser. Use after changes to the renderer, Effects.jsx, app.css, or content JSON — or whenever asked to "check the site", "verify effects", or "make sure nothing broke".
---

# Verify the site

Three layers, cheapest first. Stop at the first failing layer, fix, restart.

## 1. Unit checks (no server needed)

```bash
node scripts/check.mjs        # 26 checks: parser, dynamic tags, visibility, forms
```

## 2. Effects gate (needs a running server)

```bash
npm run dev -- -p 3210        # background it; any port works
node scripts/verify-effects.mjs http://localhost:3210
```

Asserts on every route: scroll reveals complete, split-text reveals fire, no
page errors, no unexpected 4xx/5xx; plus home circle scrub (pinned at top:0,
width strictly growing), sticky header, popup open/Escape-close at 900px width.
Screenshots in `.verify-shots/`. Exit code 1 = failures listed in output.

Known-good noise (never "fix" these): 404s for `HoE_bg-1024x*.jpg` and
`phone-bold-1.svg` (broken on the live site), hamburger hidden ≥1024px.

## 3. Live-site parity (needs a production build)

```bash
npm run build
npx next start -p 3100        # structural-diff expects 3100
node scripts/structural-diff.mjs
```

Budget: ~99.8% average text recall, 0 missing element ids. `height-diff.mjs`
and `compare.mjs` (slow) exist for layout/pixel-level investigation.

## Custom probes

For anything the gate doesn't cover, write a throwaway Playwright script — use
`createRequire('<project>/package.json')` to resolve `playwright`, capture
viewport-height section screenshots (full-page shots exceed image-view limits on
tall pages), and read computed styles instead of guessing. Scroll gradually
(~500px steps with ~100ms waits) so IntersectionObservers fire.
