---
name: wp-pipeline
description: Re-run the WordPress-to-Next.js content pipeline. Use when the WXR export changes, content JSON needs regenerating, styles in src/styles/app.css were edited, or assets/images are missing or stale.
---

# The content pipeline

Source of truth: `maintaintechnology.WordPress.2026-08-11.xml` (WXR export) →
`content/*.json` → rendered by `src/lib/elementor/`. Never hand-edit the
generated JSON or `public/styles/site.css` — fix the producing script and re-run.

## Full rebuild (in this order)

```bash
npm run extract                        # WXR -> content/*.json (offline, deterministic)
npm run assets                         # media + live stylesheets + reference HTML  [needs live site]
node scripts/build-image-manifest.mjs  # responsive variants -> content/images.json [needs live site]
node scripts/build-css.mjs             # -> public/styles/site.css                  [offline-safe if assets exist]
npm run build
```

`extract` is pure: same XML in, same JSON out. The two live-site steps only
matter when media or stylesheets changed on WordPress.

## Common partial runs

- **Edited `src/styles/app.css`** (the only hand-written CSS): just
  `node scripts/build-css.mjs`. It appends app.css last in the cascade and
  brace-balances every sheet (warns when it fixes one).
- **New WXR export**: replace the XML, update the filename in `package.json`'s
  `extract` script if it changed, run the full rebuild.
- **Contact details / options changed**: they are hard-coded in
  `scripts/extract.mjs` under `OPTIONS` (WXR has no `wp_options`) — edit there,
  then `npm run extract`.

## Things extract must preserve (regression traps)

- `_attributes` on elements (animation hooks like `text-split`) — the renderer
  emits them; losing them kills all text animation.
- `_css_classes` like `sticky_circle_wrap` / `circle` — the home scroll effect
  keys on them.
- Elementor custom-code snippets (`content/snippets.json`) — their CSS is folded
  into site.css by build-css.mjs (the Master CTA button system lives there).

After any pipeline run: `node scripts/check.mjs`, then the `verify-site` skill.
