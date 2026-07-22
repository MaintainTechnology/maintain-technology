#!/usr/bin/env node
// Maintain Technology — SessionStart hook.
// Injects brand-ops context so every session knows this is the brand repo and
// where the source of truth lives. Prints the documented SessionStart JSON so
// the text is added to Claude's context.
// ponytail: needs node on PATH (v24 confirmed in this repo). If node is ever
//           removed, delete this hook or rewrite the command as plain echo.

const context = [
  "You are working in the Maintain Technology BRAND repository (assets, not code).",
  "Source of truth for all visual specs: maintain/05 Brand Guidelines/Maintain Technology Brand Guidelines.pdf.",
  "Assets belong in the numbered folders 01-05 by purpose; do not create new top-level folders without asking.",
  "Naming: maintain-<context>-<descriptor>[-variant].<ext>, lower-kebab.",
  "Before shipping copy or assets, check them against the brand with /brand-check.",
].join(" ");

process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "SessionStart",
      additionalContext: context,
    },
  })
);
