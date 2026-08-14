# DESIGN.md — Maintain Technology design system

The visual language of maintain.com.au as implemented in this codebase. The
authoritative values live in the Elementor kit CSS (bundled into
`public/styles/site.css`), the Master CTA snippet (`content/snippets.json`), and
`src/styles/app.css` (motion layer). This file is the map, not a second source of
truth — when in doubt, read those.

## Brand palette

Dark, high-contrast enterprise brand with a single hot accent.

| Token | Hex | Use |
| --- | --- | --- |
| Primary 950 | `#101820` | Page/background dark, dark buttons |
| Secondary 950 | `#07272D` | Deep teal-black, secondary surfaces |
| Accent 600 (brand orange) | `#FF5F00` | CTAs, highlighted words, links |
| Accent 700 (orange hover) | `#CC4302` | CTA hover |
| Secondary 600 (teal) | `#257A88` | Secondary buttons, "CASE STUDY" pills |
| Accent 100 | `#FFEED3` | Warm tint |
| Tertiary 50 | `#F5F5F1` | Light surface |
| Text body | `#5B616E` | Body copy on light |
| Text light | `#f5faf9` / dark `#102320` | On-dark / on-light text |

CSS custom properties: `--e-global-color-primary`, `-secondary`, `-text` (the
orange), `-accent`, plus the extended ramps (`--e-global-color-<hash>`) from the
kit. The CTA snippet defines the semantic layer: `--primary-color`,
`--secondary-color`, `--primary-hover`, etc. Reuse those variables; never
hard-code new hex values.

## Typography

- **Albert Sans** — headings and UI. Weights 400 / 600 / 700. Self-hosted
  `@font-face` (built by `build-css.mjs` from `content/site.json`).
- **Vela Sans** — secondary family, 400 / 600 / 700.
- Kit defaults reference Roboto / Roboto Slab but the visible site is
  Albert Sans throughout (`--e-global-typography-cbd9b77-font-family` etc.).
- Headlines: uppercase, bold, tight; orange `<span>`s highlight key words inside
  white headings ("THE **STRIKEFORCE** BEHIND…").
- Split-text elements get `line-height: 1.4` and words carry
  `margin-right: 0.15em` (SplitType parity).
- Fluid sizes come from the CTA snippet's `clamp()` variables
  (`--e-global-text-lg/md/sm`); prefer them over new clamps.

## Buttons — the Master CTA system

Defined in the Master CTA snippet (pure CSS, bundled into site.css). Variants are
class-driven on the *widget container*: `.primary|.secondary|.accent|.dark|.light`
× `.solid|.outline`, sizes via `--e-global-button-{px,py,h}-{sm,md,lg}`, radius
`--e-global-border-radius: 8px`, arrow/phone icons via `.has_icon`.

The motion layer (ours, in `app.css`) is deliberately separated:

- Color/background/border transitions on the **anchor** belong to the CTA
  snippet (`all .3s`, its cascade wins at hover specificity — do not fight it).
- Transforms live on **`.elementor-button-wrapper`**: hover lift
  `translateY(-2px)` + icon nudge `translateX(3px)` (gated behind
  `(hover:hover) and (pointer:fine)`), press `scale(0.97)` at 100ms.

## Motion language

Philosophy (emil-kowalski): animate transform/opacity only, entrances use strong
ease-out, exits/feedback are faster than entrances, nothing above the fold
animates on load, everything honours `prefers-reduced-motion`, and hidden initial
states are gated behind `html.js` so no-JS never loses content.

### Curves

| Name | Value | Used for |
| --- | --- | --- |
| Strong ease-out | `cubic-bezier(0.23, 1, 0.32, 1)` | Reveals, hover lifts |
| Back-out (subtle overshoot) | `cubic-bezier(0.34, 1.56, 0.64, 1)` | `words-slide-up` |
| power2.out | `cubic-bezier(0.215, 0.61, 0.355, 1)` | Word rotate/slide-right |
| power1.out | `cubic-bezier(0.25, 0.46, 0.45, 0.94)` | Letter effects |
| Drawer (iOS-like) | `cubic-bezier(0.32, 0.72, 0, 1)` | Side-menu popup panel |
| power2.inOut | JS: `p<.5 ? 2p² : 1-(-2p+2)²/2` | Circle scroll scrub |

### Durations

Press feedback 100ms · hover 180–250ms · dropdowns 200ms · word/letter reveals
200–600ms with GSAP-style stagger *amounts* (total spread, not per-item) ·
popup 350–400ms · scroll reveals 500–600ms with 60ms sibling stagger capped at
300ms, delay cleared after play.

### The split-text directive vocabulary

Set as Elementor custom attributes (`_attributes`) on any widget; the renderer
emits them and `Effects.jsx` + `app.css` implement them. All replay when the
element re-enters from below (original ScrollTrigger behaviour); trigger point is
"top 60%" of the viewport.

| Attribute | Effect |
| --- | --- |
| `text-split` (alone) | Default word slide-up reveal |
| `words-slide-up` | Words rise from their own height, back-out, stagger 0.5 |
| `words-rotate-in` | Words rotate from rotateX(-90°), stagger 0.6 |
| `words-slide-from-right` | Words slide in 1em from right, stagger 0.2 |
| `letters-slide-up` / `letters-slide-down` | Chars rise/drop, stagger 0.6/0.7 |
| `letters-fade-in` / `letters-fade-in-random` | Char fades, ordered/random |
| `scrub-each-word` | Words brighten from 20% opacity |

### Signature moment: the circle scrub (home)

`.sticky_circle_wrap` (400vh) pins its content; `.circle` interpolates
width 60em→100%, height 40em→90vh, radius 5em→0 with power2.inOut over the
wrapper's scroll, chased at 0.18/frame for the GSAP `scrub: 1` feel. Responsive
endpoints per the original script (480/768/1200 breakpoints) live in
`circleValues()` in Effects.jsx. Reduced motion renders the expanded end state.

### Scroll reveals

Cards (`.jet-listing-grid__item`), image widgets, and icon boxes below the fold
get `.fx-reveal` → `.in-view` (18px fade-up, once-only). Elements already on
screen at load are never animated. Icon boxes also get a hover icon lift; cards a
4px hover lift.

## Rules when extending

1. Reuse the vocabulary above before inventing a new effect; new curves/durations
   go in this file and `app.css` together.
2. `site.css` is generated — motion CSS goes in `src/styles/app.css`, then run
   `node scripts/build-css.mjs`.
3. New hidden-until-revealed states must sit under `html.js` and have a
   `prefers-reduced-motion` override.
4. Never animate width/height/top/left; the circle scrub is the sanctioned
   exception (it's the original design, isolated, compositor-budgeted).
5. Verify with `node scripts/verify-effects.mjs` before calling it done.
