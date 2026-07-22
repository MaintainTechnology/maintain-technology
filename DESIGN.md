# Maintain Technology — Design System

**The core reference for every Maintain Technology visual.** Infographics, slides,
documents, social posts, web pages, campaigns — build them from this file. It is the
single source of truth for how the brand looks and how its assets fit together.

- **Strategy / voice:** [PRODUCT.md](PRODUCT.md)
- **Implement it:** [`design-system/tokens/`](design-system/tokens/) — `fonts.css`, `tokens.css`, `tokens.json`
- **See it live:** [`design-system/preview.html`](design-system/preview.html) — open in a browser
- **Find any file:** [`design-system/assets.md`](design-system/assets.md) — every asset in `maintain/` mapped to its role
- **Authoritative sources:** `maintain/05 Brand Guidelines/Maintain Technology Brand Guidelines.pdf` (May 2025) and the live build at [maintain.com.au](https://maintain.com.au)

> **Golden rule.** When you create anything for Maintain, pull colour, type, logo, icon,
> motif, and spacing from here. If a spec is missing, check the Brand Guidelines PDF,
> then extend this system — don't improvise a one-off.

---

## Contents
1. [Brand at a glance](#1-brand-at-a-glance)
2. [Logo](#2-logo)
3. [Color](#3-color)
4. [Typography](#4-typography)
5. [Iconography](#5-iconography)
6. [Graphic devices — the mountain motif & gradients](#6-graphic-devices)
7. [Photography](#7-photography)
8. [Spacing & layout](#8-spacing--layout)
9. [Components](#9-components)
10. [Motion](#10-motion)
11. [Applications](#11-applications)
12. [Governance](#12-governance)

---

## 1. Brand at a glance

| | |
|---|---|
| **Tagline** | Made to Move Mountains |
| **Idea** | Australia's enterprise-systems *strikeforce* — mission-ready SAP talent, deployed in 5 days |
| **Feel** | Bold · Precise · Relentless — dark ground, Risk Orange energy, uppercase authority |
| **Signature** | The wireframe **mountain** motif + the three-bar peak logomark |
| **Core colours** | Risk Orange `#FF5F00` · Forge Blue `#07272D` · Black `#101820` · Cloud `#F5F5F1` |
| **Fonts** | Albert Sans (display, ALL CAPS) · Vela Sans (body) |

The brand's confident mode is **dark ground + one charge of orange**. Light mode (Cloud
ground) is the calmer, document/editorial counterpart. Both are first-class; see §3.

---

## 2. Logo

The logomark is a **fast-moving, mountain-shaped "M"** — three ascending angular strokes
that read at once as an *M*, as *mountain peaks*, and as *forward motion*. It embodies
momentum, elevation, and elite execution under pressure. Source vectors:
[`maintain/01 Visual Identity/Logo/SVG/`](maintain/01%20Visual%20Identity/Logo/SVG/).

### Lockups
| Lockup | When to use | Files (`…/Logo/SVG/`) |
|---|---|---|
| **Horizontal** (mark left, wordmark right) | **Primary** — default for almost everything | `MaintainTechLogo_Horizontal_*` |
| **Vertical / stacked** (mark above wordmark) | Large-scale only, where space allows and legibility holds | `MaintainTechLogo_Vertical_*` |
| **Logomark alone** | Tight/small crops — favicons, avatars, app icons | `MaintainTechLogo_Logomark_*` |

### Colourways (the `_Primary_Dark` / `_Primary_Light` / `_White_Dark` suffixes)
Naming = `{Orientation}_{Treatment}_{Background}`:
- **`_Primary_Light`** → full-colour logo **for light backgrounds**: Risk Orange mark + Forge Blue/Black wordmark.
- **`_Primary_Dark`** → full-colour logo **for dark backgrounds**: Risk Orange mark + white/Cloud wordmark.
- **`_White_Dark`** → all-white monochrome logo for dark or busy backgrounds.
- Logomark has two builds: a compact version for dark grounds and a refined version for light grounds (gaps closed to keep the shape reading).

PNG (with/without clearspace guides) and full favicon set also provided — see [assets.md](design-system/assets.md#logo).

### Clearspace & sizing
- **Clearspace = the height of the "M" logomark** on all four sides. Nothing enters that zone.
- **Minimum size:** not fixed by the guidelines. Production minimums to adopt: horizontal lockup **≥ 120px / 32mm** wide; logomark **≥ 24px** (favicon set covers 16–512px).
- **Approved backgrounds:** solid, uncluttered, high-contrast surfaces only.

### Partnership lockups
Pair with a partner logo using a **dash separator**, vertically centred and spaced by the
clearspace (M-height). Size both marks for visual balance. Never merge or restyle either mark.

### Misuse — never
Don't distort/warp · don't outline or add a stroke · don't add a holding shape · don't
recolour · don't use multiple colours · don't crop · don't add shadows/effects · don't
rotate · don't alter orientation, colour, spacing, or composition. **Use only the approved
files** — no redraws, no substitutions.

---

## 3. Color

Seven named brand colours. Full tints/shades, RGB/CMYK/Pantone, and the light/dark semantic
mappings live in [`tokens.css`](design-system/tokens/tokens.css) and
[`tokens.json`](design-system/tokens/tokens.json). Reference **semantic tokens**
(`--color-*`) in your work, not raw hexes.

### Core palette
| Name | Hex | Pantone | Role |
|---|---|---|---|
| **Risk Orange** | `#FF5F00` | Bright Orange C | THE brand-defining accent — mark, CTAs, highlights, glow, motif |
| **Forge Blue** | `#07272D` | 5463 C | Primary dark; grounding petrol-teal; logotype ink; dark surfaces |
| **Black** | `#101820` | Black 6 C | Ink / deepest neutral; darkest backgrounds |
| **Cloud** | `#F5F5F1` | P 179-1 U | Warm off-white — the primary light ground |
| **White** | `#FFFFFF` | — | Backgrounds, reversed type |
| **Yellow** (sand) | `#E2D0A0` | 7500 CP | Secondary, sparing — warmth in decks/graphics |
| **Blue** (teal) | `#257A88` | Biscay Bay | Secondary, sparing — differentiation, the wireframe's back ridges |

Each core colour has a 6-step tint/shade ramp (`t1 t2 t3 · core · s1 s2 s3`) — see tokens.

### Two grounds (themes)
- **Dark (hero) —** ground `#101820`, surface `#07272D`, text Cloud/white, orange energy. This is the
  website hero, social, Teams, cover slides. `data-theme="dark"`.
- **Light (default) —** ground Cloud `#F5F5F1`, surface white, ink Black, headings Forge Blue.
  Documents, letterheads, editorial. Default `:root`.

### Pairings (contrast-verified, WCAG AA)
**Approved** — Risk Orange on Black (5.9:1) · White on Black (16:1) · Risk Orange on Forge Blue
(5.2:1) · Black on Risk Orange (5.9:1) · Forge Blue on Cloud (14:1) · Forge Blue on Yellow
(10:1) · White on Blue (5:1) · White on Risk Orange (3.1:1 — **large/bold only**, e.g. button labels).

**Avoid** — ⚠️ **Risk Orange as body text on Cloud/White = 2.8:1 (fails).** For orange-family *text*
on a light ground, use **`#662600`** (orange s2). Also avoid tint-on-core / core-on-tint low-contrast
pairs, bright-on-bright, and light tints on white without depth. Never use colour as the only signal.

---

## 4. Typography

Two brand typefaces. Loaded via [`fonts.css`](design-system/tokens/fonts.css) from
[`maintain/01 Visual Identity/Typography/`](maintain/01%20Visual%20Identity/Typography/).

| Face | Role | Weights | Casing |
|---|---|---|---|
| **Albert Sans** (Google, OFL) | Display, headlines, sublines, the logotype | Light→Black; **Bold** headlines, **SemiBold** sublines | Headlines **ALL CAPS**; sublines Title Case |
| **Vela Sans** (Ravid Balaliev) | Body, UI, buttons | Light→ExtraBold; **Regular** body, **Bold** buttons/emphasis | Body sentence case; button labels ALL CAPS |

> **Aptos is not a brand font.** `maintain/…/Microsoft Aptos Fonts` exists only as the Office/Word/
> PowerPoint *system fallback* (Aptos is Microsoft's default). Use it for `.docx`/`.pptx` when Vela/
> Albert aren't installed — never on the web or in brand graphics. Token: `--font-doc`.

### Type scale (fluid; mirrors the live site)
| Token | Size (min→max) | Weight | LH | Case | Family |
|---|---|---|---|---|---|
| `display-xl` | 48 → 64px | 700 | 1.1 | UPPER | Albert |
| `display-l` | 48 → 58px | 700 | 1.3 | UPPER | Albert |
| `h1` | 32 → 48px | 700 | 1.3 | UPPER | Albert |
| `h2` | 28 → 32px | 600 | 1.3 | UPPER | Albert |
| `h3` | 24 → 28px | 600 | 1.4 | UPPER | Albert |
| `h4` | 20 → 24px | 600 | 1.4 | Title | Albert |
| `h5` | 18 → 20px | 600 | 1.4 | Title | Albert |
| `eyebrow` | 14px | 600 | 1.6 | UPPER · tracking **0.2em** | Albert |
| `lead` | 24px | 400 | 1.5 | — | Vela |
| `body-lg` | 22px | 400 | 1.6 | — | Vela |
| `body` | 16px | 400 | 1.7 | — | Vela |
| `body-sm` | 14px | 400 | 1.5 | — | Vela |
| `button` | 16px | 700 | — | UPPER | Vela |

### Rules
- **Signature move:** Albert Sans **Bold, ALL CAPS**, with orange keyword highlights inside a white/ink headline (e.g. THE **STRIKEFORCE** BEHIND…).
- Display tracking tight (`-0.02em`); the eyebrow and the "TECHNOLOGY" wordmark run wide (`0.2em`).
- Body line length ≤ **68ch**. Don't set long body copy in caps.
- Emphasise inline with **Vela Bold** or Risk Orange, not italics.

---

## 5. Iconography

**Two deliberate icon systems — keep them in their own contexts.**

### A. Core icon set — product & identity
[`maintain/01 Visual Identity/Iconography/`](maintain/01%20Visual%20Identity/Iconography/) · 66 icons (PNG)
- **Style:** bold **monoline outline**, **sharp mitered** corners and squared terminals — engineered, technical, *not* rounded.
- **Stroke:** heavy, uniform (~2px on a 24px grid); square artboard, ~2px trim margin.
- **Colour:** single-tone **Forge Blue `#07272D`** on light; reverse to **white** on dark. Not orange, not two-tone.
- **Use for:** UI, dashboards, infographics, technical/system content, wherever the brand needs precision.

### B. Colored / marketing set
[`maintain/01 Visual Identity/icons-colored/`](maintain/01%20Visual%20Identity/icons-colored/) · ~24 glyphs (**SVG** + PNG) — the primary, scalable version.
Legacy PNG-only subset also in [`maintain/04 Canva Assets/Icons/`](maintain/04%20Canva%20Assets/Icons/) (12 icons).
- **Source:** **Phosphor Icons** (phosphoricons.com), **round** caps and joins.
- **Colour:** single-tone **Risk Orange `#FF5F00`** (`fill="#ff5f00"`).
- **Coverage:** business & brand glyphs — ChartBar, ChartLine, Graph, UsersThree, TreeStructure, PuzzlePiece, ShieldWarning, BookOpen, CalendarCheck, ClockClockwise, FlagBanner, FastForward, EnvelopeSimple, Phone, Target, Globe, Stack, Star, Sun, CircleCheck, WarningDiamond, MegaphoneSimple, Chats, CaretDoubleRight, LinkedinLogo.
- **Use for:** decks, social, marketing collateral, colored infographics. Prefer the **SVG**s (scale cleanly). Its round terminals + orange deliberately contrast the core set — never mix the two sets in one composition.

Need a glyph that isn't here? Match set **A**'s language (sharp, monoline, Forge Blue, 24px grid) for
product/identity work, or pull the matching **Phosphor** icon (Risk Orange fill) for marketing.

---

## 6. Graphic devices

### The mountain motif — the brand's identifier
A **3D wireframe elevation mesh**: a regular quad grid displaced by a noise heightfield, viewed from a
low, near-eye camera so sharp triangulated ridgelines sweep across the frame. It reads as *mountains*
(elevation, ascent, "move mountains") fused with *data terrain* (telemetry, monitoring, technology).
The logomark abstracts one/two peaks of this same mesh. Assets live in
[`maintain/01 Visual Identity/graphics/`](maintain/01%20Visual%20Identity/graphics/) (canonical) and `04 Canva Assets/Brand Identifiers/`.

**Two treatments:**
1. **Wireframe mesh (raster)** — `graphics/mountain forms 2.png` (panoramic) and `04 Canva Assets/Brand Identifiers/mountain forms.png`. Bright **orange grid lines on front peaks fading to teal in the recesses, on pure black**. The signature hero graphic. On a dark ground, composite with `mix-blend-mode: screen` so the black drops out and only the lines show.
2. **Vector line-art** — [`graphics/mountain.svg`](maintain/01%20Visual%20Identity/graphics/mountain.svg) — scalable topographic ridgelines with **orange→petrol (`#FF5F00 → #07272D`) gradient strokes**, wide 3580×792 panorama. Use for print, large format, or crisp web where a raster would soften.

- **Colours:** orange `#FF5F00` mesh lines (bright on front peaks, dim behind) · `#07272D` teal recesses · `#000000` ground.
- **Use:** hero/cover backgrounds, section dividers, letterhead/Teams/LinkedIn horizons. Always **orange-in-front receding to teal/behind**, anchored to a bottom or header edge, with clear negative space for title/logo. Keep line coverage low so text stays legible.

### Orange square section-bullet
A small **solid Risk Orange square** (radius `0`) immediately before an ALL-CAPS Forge Blue section
label — the system's section marker in decks and layouts.

### Gradients (the "Risk Orange" system)
CSS tokens (`--gradient-*` in [`tokens.css`](design-system/tokens/tokens.css)) plus ready-made
high-res raster/vector fills in [`graphics/`](maintain/01%20Visual%20Identity/graphics/). Use a token
for CSS surfaces; use the asset file for slides, docs, and image exports.

| Token | Build | Asset file (`graphics/`) | Use |
|---|---|---|---|
| `--gradient-hero` | `linear 152° #101820 55% → #07272D` | — | Web/section hero grounds |
| `--gradient-brand` | `linear 152° #FF5F00 → #07272D` | `gradient.jpg` · `Gradient-pantone-1.png` | The core orange→petrol brand gradient |
| `--gradient-sunset` | `linear 135° #FF5F00 → #07272D` | `cover 2.jpg` | High-impact cover / statement slides |
| `--gradient-section-glow` | radial bloom from bottom | `section.jpg` | Section dividers |
| `--gradient-orange` | `linear #FF5F00 → #662600` | `orange-gradient.png` | Warm accent fills, orange panels |
| `--gradient-teal` | `linear #257A88 → #0E3036` | `blue-gradient.png` · `blu-gradient.svg` | Secondary / cool accent fills |
| `--gradient-white` | `linear #FFFFFF → #F5F5F1` | `white-gradient.png` · `gradient-white.jpg` · `white bg.jpg` | Light-theme grounds, soft panels |
| `--gradient-mesh` | `#07272D → #FF5F00 → #F5F5F1` | — | Soft transformation backgrounds |
| `--gradient-starburst` | conic Risk-Orange rays + white-hot core | — | Peak-impact hero moments |

---

## 7. Photography

Human-centred, real, and *not* colour-graded to the brand — brand is applied on top.
Approved images: [`maintain/01 Visual Identity/Photography/`](maintain/01%20Visual%20Identity/Photography/).

- **People:** candid, diverse, authentic teams and consultations; bright, soft **natural daylight**
  (windows as key light), shallow depth of field, neutral high-key backgrounds. Fits "Humanising Tech."
- **Environment:** architecture, built environments, and mountainous landscapes for scale and control;
  people moving through landscapes = team effort and guiding clients through risk.
- **Abstraction:** motion-blur (speed/urgency), directional shapes, gradient textures (systems thinking).
- **Treatment:** signature **motion-blur** and desaturated/duotone **mountain** imagery are reserved for
  *environment & abstract* hero work — often overlaid with the orange mark. **People photography stays
  natural** (no forced orange/teal grade); brand it with the wireframe motif or a gradient overlay.
- **Hard rule:** **no AI-generated portraits** in final assets. AI imagery is allowed only for mood,
  motion, and environmental abstraction — never for people.

---

## 8. Spacing & layout

- **Space scale (4px base):** `--space-1…10` = 4, 8, 12, 16, 24, 32, 48, 64, 96, 128px. Vary spacing for rhythm; `--section-y` for the gap between major sections.
- **Containers:** content `800px` (long-form) · wide `1200px` (standard) · max `1440px`; fluid `--gutter`.
- **Radius:** `sm 4 · md 8 (default/buttons) · lg 12 (cards) · xl 20 · pill`. The section-bullet square stays `0`.
- **Layout convention (from the guidelines & applications):** logo **top-left**, contact/utility **top-right**, legal/address **bottom-left**, decorative **mountains at the bottom or in a header band**. A narrow label column (orange square + ALL-CAPS Forge Blue label) beside a larger content/visual area. Generous whitespace throughout.
- **Grid:** no fixed numeric column grid is published; use a flexible 12-col at wide sizes and `repeat(auto-fit, minmax(280px, 1fr))` for card rows.

---

## 9. Components

Baseline specs; full CSS-variable values in [`tokens.css`](design-system/tokens/tokens.css), rendered in [`preview.html`](design-system/preview.html).

### Buttons
- **Primary:** solid **Risk Orange** fill, **white ALL-CAPS Vela Bold** label, radius **8px**, hover → `#CC4C00` (light) / lighten (dark). Heights 56 / 48 / 36 (lg/md/sm); padding y 16/12/8, x ~22–24px. (White-on-orange is AA-large — fine for these bold labels; use Black-on-orange for maximum contrast.)
- **Secondary:** Forge-Blue outline or fill; on dark, Cloud outline.
- **Tertiary/link:** Risk Orange text **on dark only**; on light use `#662600`.

### Cards
Surface `--color-surface`, `1px --color-border`, radius **12px**, `--shadow-md`. On dark, the signature
treatment is a **white line icon in a dark rounded tile with an orange ember glow** (`--glow-ember`).
No nested cards; don't default every section to a card grid.

### Other
Inputs: 8px radius, 1px border, orange focus ring (`--color-focus-ring`, ≥2px, visible). Eyebrow label:
orange square + ALL-CAPS tracked Albert Sans. Use the semantic `--z-*` scale for layering.

---

## 10. Motion

Energetic but controlled — reflect speed and precision, never bounce.

- **Easing:** `--ease-out` (ease-out-quart) default; `--ease-out-expo` for larger reveals. No elastic/bounce.
- **Duration:** `150 / 300 / 500ms` (fast/base/slow); `--transition-base` for hovers.
- **Ideas:** orange keyword highlights that wipe in; ember-glow on hover; the wireframe motif drawing/parallaxing on scroll; staggered card reveals over an already-visible default.
- **Reduced motion is mandatory:** every animation needs a `prefers-reduced-motion: reduce` fallback (crossfade/instant). Tokens zero all durations under that query — don't gate content visibility on a transition.

---

## 11. Applications

How the system lands on real surfaces. Templates: [`maintain/02 Internal Materials/`](maintain/02%20Internal%20Materials/), [`maintain/03 Social Media/`](maintain/03%20Social%20Media/), [`maintain/04 Canva Assets/`](maintain/04%20Canva%20Assets/). Full index: [assets.md](design-system/assets.md).

- **Letterheads (A4)** — three variants: (1) dark header + footer band, reversed white wordmark, mountains in the header; (2)/(3) light/white, dark wordmark, mountains anchored bottom-right (T3 larger). Logo top-left, contacts top-right, legal bottom-left.
- **Presentations** — dark and light PPTX themes; Canva backgrounds `cover` / `cover 2` (sunset) / `gradient` (quiet body) / `section` (glow divider). Orange-square + ALL-CAPS section headers.
- **Teams backgrounds** — dark (`#101820` + orange/teal wireframe) and light (white + orange/grey wireframe); keep the upper-left clear for the video tile; `#MadetoMoveMountains` top-right.
- **Social** — LinkedIn cover (dark, mountain horizon, ALL-CAPS headline); profile pics (dark full lockup / light logomark-only). Web uses the horizontal Primary_Light logo on the dark hero.
- **Documents (Word/PPT)** — brand fonts if installed, else Aptos fallback; brand colours via `tokens.json`.

**Consistency rule:** the mountain motif is the connective device on *every* application, always
orange-front → teal/grey-behind, edge-anchored. Two-colour discipline (orange + petrol/black) + white,
teal only inside the wireframe.

---

## 12. Governance

- **This file + `design-system/` is the source of truth.** New Maintain visuals reference it first; the Brand Guidelines PDF is the authority behind it.
- **Extending the system:** add the value to `tokens.css` **and** `tokens.json` (keep them in sync), document it in the relevant section here, and add any new file to [assets.md](design-system/assets.md). Prefer extending a token over hardcoding a one-off.
- **Checking work:** run `/brand-check` (`.claude/skills/brand-check`) or the `brand-guardian` agent against new material; both defer to this system.
- **Provenance:** colours/type/logo/motif from *Maintain Technology Brand Guidelines* (May 2025, by Jayr Marasigan); production numeric scales, tokens, and a11y ratios derived from maintain.com.au and verified for this system (v1.0.0, 2026-07-14).
