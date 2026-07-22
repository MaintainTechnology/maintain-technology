# Asset Index — Maintain Technology

Every design file in [`maintain/`](../maintain/) mapped to its role in the design system.
This is the bridge between the specs in [DESIGN.md](../DESIGN.md) and the real files. Paths are
relative to this file (`design-system/`). When you add an asset to `maintain/`, add it here too.

Legend: 🎨 visual identity · 📄 document/template · 📣 social · 🖼️ Canva · 📕 reference

---

## Logo &nbsp;🎨
[`../maintain/01 Visual Identity/Logo/`](../maintain/01%20Visual%20Identity/Logo/)

**SVG (vector — preferred for web & print)** — `Logo/SVG/`
Naming: `MaintainTechLogo_{Orientation}_{Treatment}_{Background}.svg`

| Orientation | For light bg (`Primary_Light`) | For dark bg (`Primary_Dark`) | Mono white (`White_Dark`) |
|---|---|---|---|
| Horizontal (primary) | `Horizontal_Primary_Light.svg` | `Horizontal_Primary_Dark.svg` | `Horizontal_White_Dark.svg` |
| Vertical (large only) | `Vertical_Primary_Light.svg` | `Vertical_Primary_Dark.svg` | `Vertical_White_Dark.svg` |
| Logomark (small/tight) | `Logomark_Primary_Light.svg` | `Logomark_Primary_Dark.svg` | `Logomark_White_Dark.svg` |

**PNG (raster)** — `Logo/PNG/Clearspace/` (with spacing guides) and `Logo/PNG/No Clearspace/` (production). Same 9 name combinations each.

**Favicon set** — `Logo/Favicon/`: `favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png`, `android-chrome-192x192.png`, `android-chrome-512x512.png`, `site.webmanifest`.

→ Spec: [DESIGN.md §2](../DESIGN.md#2-logo).

---

## Typography &nbsp;🎨
[`../maintain/01 Visual Identity/Typography/`](../maintain/01%20Visual%20Identity/Typography/)

| Family | Role | Files |
|---|---|---|
| **Albert Sans** (OFL) | Display / headings | `Albert Sans/` — variable `AlbertSans-VariableFont_wght.ttf` (+ italic) and 18 static weights in `static/` |
| **Vela Sans** | Body / UI | `Vela Sans/` — 7 OTF: ExtraLight, Light, Regular, Medium, SemiBold, Bold, ExtraBold |
| **Microsoft Aptos** ⚠️ *not a brand font* | Office/Word/PowerPoint fallback only | `Microsoft Aptos Fonts/` — full family + EULA |

Wired for web in [`tokens/fonts.css`](tokens/fonts.css). → Spec: [DESIGN.md §4](../DESIGN.md#4-typography).

---

## Iconography &nbsp;🎨

**A · Core set** — [`../maintain/01 Visual Identity/Iconography/`](../maintain/01%20Visual%20Identity/Iconography/) · 66 PNG · monoline, sharp, Forge Blue `#07272D`:
`Add · Analytics Pie · Arrow External Left/Right · Arrow Left/Right · Badge · Bell · Bin · Briefcase · Calendar · Care · Check · Chevron Down/Left/Right/Up · CircleCheck · Clock · Close · Code · Cog · Coin · Credit Card · Database · Desktop · Dollar · Email · Eye · Filter · Flag · Folder · Graph · Graph Ascend/Descend · Heart · Home · Info · Laptop · Less · Lightning · Link · Mark · Megaphone · Message · Mobile · Password · Pencil · Pencil Writing · Phone · Play · Play-1 · Report · Search · Settings · Share · Star · Support · Sync · Tag · Test · Tool · User · Wallet · Web · Wifi`

**B · Colored/marketing set** — [`../maintain/01 Visual Identity/icons-colored/`](../maintain/01%20Visual%20Identity/icons-colored/) · **SVG + PNG** · Phosphor, round, Risk Orange `#FF5F00`. The primary, scalable set (~24 glyphs):
`BookOpen · CalendarCheck · CaretDoubleRight · ChartBar · ChartLine · Chats · CircleCheck · ClockClockwise · EnvelopeSimple · FastForward · FlagBanner · Globe · Graph · LinkedinLogo · ListChecks · MegaphoneSimple · Phone · PuzzlePiece · ShieldWarning · Stack · Star · Sun · Target · TreeStructure · User · UsersThree · WarningDiamond`
_Prefer the `.svg` files. Some `.png`s have duplicate `(1)…(4)` exports — use the base name._
Legacy PNG-only subset (12) also in [`../maintain/04 Canva Assets/Icons/`](../maintain/04%20Canva%20Assets/Icons/).

→ Spec: [DESIGN.md §5](../DESIGN.md#5-iconography).

---

## Graphic devices &nbsp;🖼️
Canonical library: [`../maintain/01 Visual Identity/graphics/`](../maintain/01%20Visual%20Identity/graphics/)

**Mountain motif**
| Treatment | File | Notes |
|---|---|---|
| Wireframe (raster) | `graphics/mountain forms 2.png` · `04 Canva Assets/Brand Identifiers/mountain forms.png` | orange→teal mesh on black; composite `mix-blend-mode: screen` on dark |
| Vector line-art | [`graphics/mountain.svg`](../maintain/01%20Visual%20Identity/graphics/mountain.svg) | orange→petrol gradient ridgelines, 3580×792, scalable |

**Gradient library** (`graphics/`) — see the token map in [DESIGN.md §6](../DESIGN.md#6-graphic-devices):
`gradient.jpg` · `gradient.png` · `Gradient-pantone-1.png` (brand orange→petrol) · `orange-gradient.png` (`--gradient-orange`) · `blue-gradient.png` / `blu-gradient.svg` (`--gradient-teal`) · `white-gradient.png` / `gradient-white.jpg` / `white-lineargradient.png` / `white bg.jpg` (`--gradient-white`) · `cover.jpg` · `cover 2.jpg` · `section.jpg`

**Presentation backgrounds** (mirrors of the above): [`../maintain/04 Canva Assets/Presentation Backgrounds/`](../maintain/04%20Canva%20Assets/Presentation%20Backgrounds/) — `cover.jpg`, `cover 2.jpg`, `gradient.jpg`, `section.jpg`

> ⚠️ Housekeeping: `graphics/` contains a stray file with a corrupted name (`–°–_xBB_…(0).png`). It's not a brand asset — rename to the convention or remove.

→ Spec: [DESIGN.md §6](../DESIGN.md#6-graphic-devices).

---

## Photography &nbsp;🎨
[`../maintain/01 Visual Identity/Photography/`](../maintain/01%20Visual%20Identity/Photography/) · 8 approved images — candid, natural-daylight business/consulting scenes. Brand via overlay, not grade. → [DESIGN.md §7](../DESIGN.md#7-photography).

---

## Internal materials &nbsp;📄
[`../maintain/02 Internal Materials/`](../maintain/02%20Internal%20Materials/)

| Asset | Files |
|---|---|
| CV template | `CV Template/CV Template.docx` |
| Cover letters | `Cover Letter Templates/Cover Letter Template 1–3.docx` |
| Email signature | `Email Signatures/Email Signature.docx` |
| Letterheads (A4) | `Letterheads/Template 1–3.jpg` — T1 dark band, T2/T3 light |
| Presentations | `Presentation Templates/Presentation Template.pptx` (+ Dark / Light themes) |
| Teams backgrounds | `Teams Background/Dark Theme.png`, `Light Theme.png` (1920×1080) |

→ Spec: [DESIGN.md §11](../DESIGN.md#11-applications).

---

## Social media &nbsp;📣
[`../maintain/03 Social Media/`](../maintain/03%20Social%20Media/)

| Asset | Files |
|---|---|
| LinkedIn cover | `Linkedin Cover/Linkedin Cover.png` (~1584×396) |
| Profile pictures | `Profile Picture/Primary Logo Dark.png`, `Primary Logo Light.png`, `Logomark Dark.png`, `Logomark Light.png` (2048²) |

---

## Canva assets &nbsp;🖼️
[`../maintain/04 Canva Assets/`](../maintain/04%20Canva%20Assets/) — `Brand Identifiers/`, `Icons/` (set B above), `Presentation Backgrounds/`. Mirror the Canva brand kit.

---

## Reference documents &nbsp;📕
- **Brand Guidelines (source of truth):** [`../maintain/05 Brand Guidelines/Maintain Technology Brand Guidelines.pdf`](../maintain/05%20Brand%20Guidelines/) — 65pp, May 2025
- **Brand Delivery Overview:** [`../maintain/Brand Delivery Overview.pdf`](../maintain/Brand%20Delivery%20Overview.pdf) — deliverables index
- **Live implementation:** [maintain.com.au](https://maintain.com.au) — Albert Sans + Vela Sans, same logo SVGs, dark hero
