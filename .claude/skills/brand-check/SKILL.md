---
name: brand-check
description: Use when creating or reviewing ANY Maintain Technology brand-facing material — social posts, email signatures, letterheads, presentations, logos, or visual assets — to check it against the brand guidelines for voice, naming, logo usage, color, and typography. Trigger on "check the brand", "is this on-brand", "/brand-check", or before shipping marketing copy or an asset.
---

# Brand Check

Verify that a piece of content or an asset is consistent with Maintain
Technology's brand before it ships.

## Source of truth

**Check against the design system first: [`DESIGN.md`](../../../DESIGN.md) and
`design-system/tokens/` (`tokens.json` has every exact value).** It is the core
reference for all visual specs. The Brand Guidelines PDF
(`maintain/05 Brand Guidelines/…pdf`) is the authority behind it — consult it
only when DESIGN.md doesn't cover something. Don't rely on memory for precise values.

Key anchors: Risk Orange `#FF5F00`, Forge Blue `#07272D`, Black `#101820`,
Cloud `#F5F5F1`; Albert Sans (headings, ALL CAPS) + Vela Sans (body). Aptos is
Office-document fallback only, **not** a brand font. The mountain motif is the
connective device on every surface.

## Checklist

Run through these; report each as pass / flag / needs-source-value.

1. **Naming & placement** — Does the filename follow
   `maintain-<context>-<descriptor>[-variant].<ext>` (lower-kebab), and is it in
   the correct `01`–`05` folder for its purpose?
2. **Logo usage** — Correct variant/colorway for the background (`_Primary_Light`
   on light, `_Primary_Dark` on dark)? Clearspace (= M-height) and min size kept?
   Not stretched, recolored, outlined, or on a clashing surface? (DESIGN.md §2.)
3. **Color** — Only palette colors (DESIGN.md §3 / `tokens.json`). Flag off-palette
   values and cite the intended token. Watch contrast: Risk Orange text on light
   fails — use `#662600`.
4. **Typography** — Albert Sans + Vela Sans only, correct weights/casing (headings
   ALL CAPS). Flag Aptos or any substitute used as a brand face.
5. **Voice & copy** — Bold, precise, tactical tone; "Made to Move Mountains";
   correct naming ("Maintain Technology"); no typos; claims match messaging (PRODUCT.md).
6. **Graphic language** — Mountain motif used correctly (orange-front → teal-behind,
   edge-anchored)? Gradients/icon set appropriate to context (core petrol vs Canva orange)?
7. **Format fit** — Correct dimensions/aspect ratio for the destination
   (e.g. LinkedIn cover, Teams background, presentation slide).

## Output

For each item: `✓ item` or `⚠ item — what's off + the on-brand fix (with the
DESIGN.md/token value or where to find it)`. End with a one-line verdict:
**on-brand / needs changes**. If a value can't be confirmed, say so rather than guessing.
