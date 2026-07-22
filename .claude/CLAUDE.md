# Maintain Technology — Brand Repository

This repo is the **single source of truth for Maintain Technology's brand and
marketing assets**. It is not a software project — it holds visual identity,
templates, social assets, and the brand guidelines that everything else must
follow.

## What lives here

```
DESIGN.md               ← THE design system: the core reference for every visual
PRODUCT.md                strategy, voice, personality, principles
design-system/            tokens (css/json), fonts.css, assets index, living preview.html
maintain/
  01 Visual Identity/     Logo, Iconography, Typography, Photography
  02 Internal Materials/  CV, Cover Letters, Email Signatures, Letterheads,
                          Presentation Templates, Teams Backgrounds
  03 Social Media/        LinkedIn Cover, Profile Picture
  04 Canva Assets/        Brand Identifiers, Icons, Presentation Backgrounds
  05 Brand Guidelines/    Maintain Technology Brand Guidelines.pdf  (authority behind DESIGN.md)
  Brand Delivery Overview.pdf
```

**[DESIGN.md](../DESIGN.md) is the source of truth for every visual** — colors,
type, logo, icons, the mountain motif, spacing, components. Build infographics,
docs, slides, social, and web from it and its tokens (`design-system/tokens/`).
It is derived from the Brand Guidelines PDF (the authority behind it) plus
maintain.com.au; read the PDF only when DESIGN.md doesn't cover something, then
extend the system.

## Conventions

- **Put assets in the numbered folder that matches their purpose.** A LinkedIn
  banner goes in `03 Social Media/Linkedin Cover`, not a new top-level folder.
- **Naming:** `maintain-<context>-<descriptor>[-variant].<ext>`, lower-kebab.
  e.g. `maintain-linkedin-cover-dark.png`, `maintain-email-signature-sales.html`.
- **Don't rename or move delivered folders** (`01`–`05`) — downstream links and
  Canva references depend on them.
- **Large binaries** (PDF, PNG, PSD, MP4) are expected here; keep exports, not
  working scratch files, out of version control.

## The `.claude` toolkit

This directory wires Claude Code to the brand workflow:

| Path | Purpose |
|------|---------|
| `skills/brand-check/` | Checklist for reviewing anything against the brand |
| `commands/brand-check.md` | `/brand-check` — review a file or text |
| `commands/new-asset.md` | `/new-asset` — scaffold an asset in the right place |
| `agents/brand-guardian.md` | Read-only reviewer that flags off-brand output |
| `hooks/session-start.js` | Injects brand context at the start of each session |

The session-start hook uses a **relative path** (`node .claude/hooks/...`)
because `$CLAUDE_PROJECT_DIR` does not expand under PowerShell on Windows.
Launch Claude from the repo root so the hook resolves.

## Working here

- **Design first from [DESIGN.md](../DESIGN.md) and `design-system/tokens/`.** Pull
  colors (Risk Orange `#FF5F00`, Forge Blue `#07272D`, Cloud `#F5F5F1`…), type
  (Albert Sans caps + Vela Sans; Aptos is Office-only, not a brand font), the
  mountain motif, and spacing from there — don't improvise a one-off.
- Extending the system? Update `tokens.css` **and** `tokens.json`, note it in
  `DESIGN.md`, and add any new file to `design-system/assets.md`.
- When generating copy or assets, run it past `/brand-check` before it ships.
- Ask before creating new top-level folders or naming schemes.
