# maintain.com.au — Next.js

A WordPress → Next.js conversion of **Maintain Technology**, built from the
WXR export (`maintaintechnology.WordPress.2026-08-11.xml`). No WordPress, no
PHP, no database at runtime — every page is prerendered static HTML.

## Why this was tractable

The site was built with Elementor + JetEngine *components*, which is already a
props-driven component system:

| WordPress thing | What it became |
| --- | --- |
| `_elementor_data` (JSON layout tree) | React component tree (`src/lib/elementor/render.jsx`) |
| `jet-engine-component-N` + `_component_props` | React component with typed props |
| `[elementor-tag name="jet-post-custom-field"]` | Dynamic-tag resolver (`src/lib/elementor/props.js`) |
| JetEngine Dynamic Visibility (`jedv_*`) | Conditional rendering |
| `cs_*` postmeta on the case-study CPT | `content/case-studies.json` |
| Forminator forms | React forms + `/api/forms` (`src/components/Form.jsx`) |
| Elementor generated CSS | `public/styles/site.css` (taken verbatim) |
| Elementor Custom Code snippets (`_elementor_code`) | folded into the CSS bundle / `content/snippets.json` |
| jQuery + GSAP + ScrollTrigger + SplitType + Elementor JS | `src/components/Effects.jsx` (native: sticky header, popup, split-text reveals, circle scroll scrub, card/image reveals) |

## Layout

```
content/            extracted content model (JSON, the source of truth)
  site.json           design tokens, fonts, nav, options, permalinks
  pages.json          16 pages with their Elementor trees
  components.json     16 JetEngine components (prop schema + template)
  templates.json      header, footer, popup, single/archive, reusable sections
  case-studies.json   7 case studies with all cs_* fields
  newsletters.json    6 newsletter issues
  forms.json          3 forms with fields, options and conditional logic
  page-css/           per-page Elementor CSS (offline fallback)
public/
  assets/             138 downloaded media files
  styles/site.css     the site's real stylesheets, concatenated
scripts/            the conversion pipeline (see below)
src/
  app/                routes
  components/         Form, NavMenu, HtmlWidget, Effects
  lib/elementor/      the Elementor → React renderer
reference/          live-site HTML + screenshots, used for verification
```

## Pipeline

Run in this order from a clean checkout:

```bash
npm install
npm run extract                        # WXR -> content/*.json (offline, deterministic)
npm run assets                         # media + live stylesheets + reference HTML
node scripts/build-image-manifest.mjs  # responsive variants -> content/images.json
node scripts/build-css.mjs             # -> public/styles/site.css
npm run build
```

`extract` is pure: re-running it on the same XML always produces the same JSON.
Re-export from WordPress and re-run to pull in content changes. The other three
steps need the live site reachable.

## Verification

Three checks. The first needs nothing running:

```bash
node scripts/check.mjs             # 26 unit checks (parser, tags, visibility, forms)

npx next start -p 3100
node scripts/structural-diff.mjs   # DOM/text parity vs reference/html (fast, offline)
node scripts/height-diff.mjs / /   # per-element layout diff vs live
node scripts/compare.mjs           # full-page screenshot diff vs live (slow, ~15 min)
```

`structural-diff` across all 22 routes:

```
average text recall 99.8% | missing element ids 0 | extra element ids 0
```

Widget counts, container counts, image counts and Elementor element IDs match
the live site exactly on every route. Screenshot diff: case-study pages land at
**0.3%** differing pixels; content pages sit in the single digits to low teens,
almost entirely from small cumulative vertical offsets rather than visible
differences (full-page diffing is unforgiving — a few pixels of height drift
near the top misaligns everything below it).

## Deliberate differences

These are changes, not gaps — each replaces something that only existed to prop
up WordPress:

- **No jQuery / GSAP / ScrollTrigger / SplitType / Elementor JS.** ~700 kB of
  vendor script replaced by 103 kB of app JS. Reimplemented natively (all
  honouring `prefers-reduced-motion`, with initial states gated on `html.js`
  so no JS never hides content):
  - the home-page `.sticky_circle_wrap` GSAP scrub (rounded card grows to
    full-bleed over 400vh of scroll) as `position:sticky` + rAF interpolation;
  - the SplitType word/char animation library (`text-split`,
    `words-slide-up/-rotate-in/-slide-from-right`, `letters-*`), driven by the
    Elementor `_attributes` the renderer now emits;
  - sticky header, side-menu popup (Elementor popup action links), and
    scroll-reveal with stagger for cards, images and icon boxes;
  - button hover lift / press feedback on `.elementor-button-wrapper`
    (transform only, so the Master CTA colour transitions stay untouched).
- **Forms are React + a server route.** Validation runs on the server as well as
  the client; conditional fields are enforced server-side too. Delivery is
  pluggable — see *Configuration*.
- **Nav dropdowns are CSS/`:focus-within`,** not SmartMenus, so they work
  without JS and are keyboard accessible.
- **A skip link was added.** The original theme had none.

### Two real defects fixed on the way through

Worth knowing about, because both were invisible until measured:

1. **A stray `}` in Elementor's generated CSS.** `post-8.css` (the design-token
   kit) had an unclosed block and two other files had extra closers. As separate
   `<link>`s each file is its own parse context so the damage is contained; once
   concatenated, one bad brace silently killed every rule after it — including
   the entire button system. `scripts/build-css.mjs` now balances each stylesheet
   before joining, and warns when it has to.
2. **`.pretty` is a marker class with no styling.** An earlier pass here treated
   it as an animation hook, which hid 54 elements per page until JS ran. The
   real animation targets `[text-split]` (5 elements) and is scoped that way now.

## Known gaps

- **`jet-options-page` values are not in the export.** JetEngine Options Pages
  live in `wp_options`, which WXR does not include. The six referenced values
  (contact email, phone, address, LinkedIn, booking link, contact form) were
  recovered from the live site's rendered HTML and are hard-coded in
  `scripts/extract.mjs` under `OPTIONS`. **Edit them there if they change.**
- **Responsive image variants are recovered from the live HTML, not the export.**
  WordPress serves `-1024x576` style resizes via `srcset`, but WXR only names the
  originals. `scripts/build-image-manifest.mjs` reads the variant sets out of the
  captured pages and downloads them. If you add images in WordPress later,
  re-run that script (or switch to `next/image`).
- **Two images 404 on the live site too** —
  `2025/07/HoE_bg-1024x576.jpg` and `2025/07/phone-bold-1.svg`. Broken before
  the migration; not introduced by it.
- **Pre-existing markup bug reproduced:** the footer/contact address is wrapped
  in a link whose href is the address itself (`http://Brisbane,%20QLD...`). It
  renders identically to the current site. Worth fixing, but that's a content
  change, not a migration one.
- **`/blog` is `pending` in WordPress** so it is not published here either. The
  single post at `/blog/<slug>` does render.
- The **Zoho Recruit** embed on `/careers` is still a third-party script. It is
  loaded after hydration and verified to render the same 31 kB of job listings
  as the live page.
- **The ZoomInfo visitor-tracking snippet and Google Tag Manager were not
  carried over.** Both are in `content/snippets.json` / the original export if
  you want them back — that is a decision about analytics and consent, not a
  migration detail.

## Configuration

Every form on the site — the contact form (`2539`, on `/contact` and in the
footer CTA that appears site-wide), the footer newsletter signup (`1311`) and
the legacy contact form (`1225`) — posts to `/api/forms`. That single route is
where delivery is wired, so configuring it covers all of them at once.

Email goes out through [Resend](https://resend.com/docs):

```bash
RESEND_API_KEY=re_…                                    # required to send
RESEND_FROM="Maintain Technology <noreply@maintain.com.au>"   # verified domain
FORM_TO_EMAIL=info@maintain.com.au
FORM_CC_EMAIL=jon@pepco.com.au                         # comma-separated list
FORM_WEBHOOK_URL=https://…                             # optional second channel
```

Only `RESEND_API_KEY` has no default — the rest fall back to the values above.
`RESEND_FROM` must be an address on a domain verified in the Resend dashboard
(Domains → Add Domain → add the DKIM/SPF records); an unverified domain returns
a 403 and nothing sends. `Reply-To` is set to the submitter, so replying in the
inbox reaches them while the message itself stays DKIM-aligned to maintain.com.au.

`FORM_WEBHOOK_URL` fires alongside the email when set. A submission is treated
as failed only when *every* configured channel fails, and its content is written
to the log in that case so it can still be recovered. With nothing configured at
all, submissions are logged instead of dropped and the site still builds.

The route also rate-limits to 10 submissions per IP per 10 minutes and carries a
honeypot field; both are per-instance, so put a Vercel Firewall rule on
`/api/forms` if the site ever scales past one warm instance.

## Deploying

Static output plus one API route, so anything that runs Node works. On Vercel it
is zero-config: the framework is auto-detected, every page prerenders at build
(`dynamicParams = false` on the slug routes — unknown slugs 404 instead of
rendering on demand), and only `/api/forms` runs as a function. `.vercelignore`
keeps the brand library (`maintain/`), the captured live site (`reference/`),
and the WXR export out of CLI uploads — the build only needs `src/`, `content/`,
`public/`, and `next.config.mjs`.

Two ways to deploy:

```bash
# CLI (first time: link, then deploy)
npm i -g vercel
vercel link
vercel          # preview URL
vercel --prod   # production

# or connect the git repo at vercel.com/new — every push then deploys
# (preview per branch, production from main)
```

Before going live:

1. Point `metadataBase` in `src/app/layout.jsx` and `BASE` in
   `src/app/sitemap.js` at the production domain if it is not maintain.com.au.
2. Set `RESEND_API_KEY` (see `.env.example`) in Project Settings → Environment
   Variables, or `vercel env add RESEND_API_KEY`, and confirm the sending domain
   shows *verified* in the Resend dashboard. Env var changes only apply to new
   deployments, so redeploy after adding it. Send one test enquiry and confirm
   it arrives — mail from your own domain into your own inbox is the case most
   likely to be filtered, so allowlist it in Microsoft 365 if it lands in junk.
3. Re-add Google Tag Manager (`GT-NNZ3WDJC`) if you still want it — it was
   deliberately not carried over.
