# Maintain Technology — Design System

The central, reusable system behind every Maintain Technology visual: graphics, documents,
slides, social, and the website. Build from here so everything stays consistent and on-brand.

## Start here
- **[../DESIGN.md](../DESIGN.md)** — the core spec. Colour, type, logo, icons, motif, gradients,
  spacing, components, motion, applications. *Read this first.*
- **[../PRODUCT.md](../PRODUCT.md)** — strategy, voice, personality, principles.
- **[preview.html](preview.html)** — open in a browser to *see* the system rendered live.
- **[assets.md](assets.md)** — every file in [`../maintain/`](../maintain/) mapped to its role.

## Use the tokens
```
tokens/
  fonts.css     @font-face for Albert Sans + Vela Sans (points into ../maintain/…/Typography)
  tokens.css    CSS custom properties — colours, type scale, spacing, radius, shadow, motion, gradients
  tokens.json   the same values, machine-readable (Figma / Canva / Style Dictionary / scripts)
```

**Web / HTML:**
```html
<link rel="stylesheet" href="design-system/tokens/fonts.css">
<link rel="stylesheet" href="design-system/tokens/tokens.css">
```
```css
.cta {
  background: var(--color-primary);           /* Risk Orange */
  color: var(--color-on-primary);
  font: var(--fw-bold) var(--text-body)/1 var(--font-body);
  text-transform: uppercase;
  border-radius: var(--radius-md);
  padding: 12px 24px;
  transition: var(--transition-base);
}
```
Add `data-theme="dark"` on `<html>` (or any wrapper) for the dark hero ground.

**Documents / Canva / Figma:** pull hexes, type, and spacing from `tokens.json` (names match the
Brand Guidelines — Risk Orange, Forge Blue, Cloud…). For `.docx`/`.pptx`, brand fonts if installed,
else the Aptos fallback (`--font-doc`).

## Golden rules
1. Reference **semantic tokens** (`--color-primary`, `--text-h1`…), not raw hexes, in components.
2. Dark ground + one charge of Risk Orange = the confident mode. Orange is a scalpel, not a wash.
3. Albert Sans **ALL CAPS** for authority; Vela Sans for body. Aptos is Office-only, never a brand font.
4. The **mountain motif** is the connective device on every surface.
5. Extending the system? Update `tokens.css` **and** `tokens.json`, note it in `DESIGN.md`, list the file
   in `assets.md`. Verify new work with `/brand-check` or the `brand-guardian` agent.

_v1.0.0 · derived from the Maintain Technology Brand Guidelines (May 2025) and maintain.com.au._
