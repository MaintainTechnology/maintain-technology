---
name: maintain-infographics
description: >-
  Branded social-graphics generator for Maintain Technology. Use whenever the
  user wants "a post for Maintain", a LinkedIn carousel, an Instagram post, a
  stat card, a testimonial card, a "how it works" graphic, an infographic, a
  marketing tile, or a flyer. You supply the copy; it enforces the brand so every
  graphic looks like the same system. Produces on-brand PNGs + a ready-to-post
  carousel PDF from a SLIDES JSON array via a bundled HTML engine and a Playwright
  render script. Trigger on /maintain-infographics or any "make a branded
  post/graphic/carousel/infographic for Maintain" request.
---

# Maintain Technology — Infographics & Social Graphics

The on-brand alternative to hand-rolling CSS for every post. You give it the **copy**; it
handles all the styling so every graphic comes out looking like Maintain Technology.

**What it makes:** on-brand PNGs and a ready-to-post carousel PDF — LinkedIn carousels,
Instagram posts, stat cards, testimonial cards, "how it works" graphics, marketing tiles.

## How it works

1. **Edit the copy** in [`assets/slides.json`](assets/slides.json) — a `SLIDES` array, one entry per panel (headline, numbers, items, quote, etc.). Copy an existing entry and change the text.
2. **Render:** `node .claude/skills/maintain-infographics/scripts/render.mjs` — drives the bundled engine ([`assets/generator.html`](assets/generator.html)) with Playwright and writes `slide-1.png … slide-N.png` + `carousel.pdf` to `scripts/out/` (override: `node scripts/render.mjs <slides.json> <outDir>`).
3. **Place & name** the exports per repo convention: social → `maintain/03 Social Media/`, named `maintain-<context>-<descriptor>[-variant].<ext>`.

Preview without rendering: serve the repo over a local HTTP server and open
`/.claude/skills/maintain-infographics/assets/generator.html` (the engine reads `slides.json`).
`file://` will not work — the engine links the design-system fonts/tokens over http.

## The design it enforces (the Maintain system)

Pulled live from the repo's design system — never re-typed, never guessed:
- **Ground:** dark — Black `#101820` / Forge Blue `#07272D` (the hero gradient). Light (Cloud `#F5F5F1`) only when asked.
- **One accent:** Risk Orange `#FF5F00`. Teal `#257A88` / Yellow `#E2D0A0` are sparing secondaries, never a competing accent.
- **Type:** Albert Sans (display / headlines, ALL CAPS, **one orange keyword** per headline) + Vela Sans (body). Aptos is Office-only and never appears here.
- **Signature devices:** the wireframe **mountain motif** (`graphics/mountain forms 2.png`, screen-blended on dark), brand **gradients**, the **ember-glow** icon tile, colored Risk Orange Phosphor icons.
- **Corners:** 8px (pills) / 12px (cards); the orange section-bullet stays square. Radii from `tokens.css`.
- **Fonts + tokens:** linked from [`design-system/tokens/`](../../../design-system/tokens/); values from [`DESIGN.md`](../../../DESIGN.md). Do not hardcode hex — use the tokens.

Default size: **1080×1350** (LinkedIn/IG 4:5 carousel). Also 1080×1080 (square) and 1080×1920 (story) via the `format` field.

## Panel types (compose a carousel from these)

`cover` (hook + logo + motif) · `stat` (one hard number) · `list` (breakdown in bordered cards) ·
`steps` (real ordered sequence) · `quote` (real testimonial) · `cta` (closing call to action).
A typical carousel runs **cover → stat → list → steps → quote → cta**.

## Anti-slop rules (what keeps it from reading as AI-made)

- **Risk Orange text never on a light ground** (2.8:1 fails) — orange lives on dark, or use `#662600` on light.
- **One accent only** — no second competing colour.
- **No gradient text, glassmorphism, side-stripe borders, identical-card-grid filler, or an eyebrow on every slide.**
- **No emoji, no exclamation-mark drama, no em-dash overuse.**
- **No invented testimonials or fake stats** — every number and quote must come from material the user provides or the brand docs. Missing? Put `[[NEEDS: …]]` and ask; never fabricate.
- **No text clipping** — copy stays inside the safe margin at the final size. Trim copy if it overflows; don't shrink below the type floor.
- Verify visually (render + look) and pass `/brand-check` before shipping.

## Dependencies

Needs the repo's `design-system/` and `maintain/` present (this skill references them, so
brand values stay in sync). `render.mjs` needs Playwright Chromium: `npm i playwright &&
npx playwright install chromium` once. If Playwright isn't available, render via the browser
tools instead (serve + screenshot each `.panel`, then print-to-PDF at 1080×1350).
