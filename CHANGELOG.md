# Changelog

All brand-layer changes are listed here. After updating the template, run `scripts\update-app.ps1 -App C:\dev\your-app` for each app.

## 1.1.1 (October 2026)

The brand test no longer expects the starter heading, so apps with their own first screen pass.

## 1.1.0 (October 2026)

- **Logo: lock-up only** (RNZ decision; departs from global guidelines §3.3.9 for software and needs APAC brand approval). `<AppShell>` always shows the RICOH lock-up (`public/brand/RICOH-Logo_sRGB_full-colour.png`, logo with the "imagine. change." tagline) at 40px tall, about 92px wide. It can't be swapped or hidden. The lock-up is now brand-managed, so updates reach every app. The brand check fails on any other logo file, a typed "RICOH" logo, or a logo favicon.
- **File names never change.** New rule in `AGENTS.md` and the skills. The brand check now fails, not warns, when a brand-managed file is missing or renamed.
- **Brand guide shipped with the skills:** `ricoh-brand-methodology-v12.html` (v12.3, copied from `rnz-ai-library`) at `.agents/skills/rnz-app-brand/references/`. The tables standard is not shipped: it still uses #1A1A1A text, uppercase headers, eyebrows and a drawn logo mark. Its table rules are summarised in `rnz-app-patterns` instead.
- **New skill `rnz-rebrand`** for apps made elsewhere. `rnz-app-patterns` gains a "before a model is connected" rule: one connect panel, not an empty state in every card.
- **Setup and update scripts:** `scripts/new-app.ps1` and `scripts/update-app.ps1`, with no angle-bracket placeholders, apps created outside OneDrive, and a guard against changing the template folder.
- **Template source guard:** root `AGENTS.md`, `CLAUDE.md` and Copilot instructions say this repo is not an app. The template's own `AGENTS.md` stops agents building inside the template.
- **Windows-safe brand fingerprints:** `rnz:check` and `rnz:sync` ignore line endings; `.gitattributes` keeps LF. Maintainer script `scripts/rnz-lock.mjs` writes and verifies the lock.
- **Template checks** workflow on every pull request and push to main.
- Removed Microsoft's `CODE_OF_CONDUCT.md` and `SECURITY.md` from the template. `LICENSE` stays.
- `UPSTREAM.md` records the Microsoft base.

Existing apps: run `scripts/update-app.ps1`. It adds the lock-up and new skills. It doesn't delete files, so remove `CODE_OF_CONDUCT.md` and `SECURITY.md` from an app by hand if you want to. Apps that set `logoSrc` on `<AppShell>` still compile; the prop is ignored and can be removed.

## 1.0.0 (2 October 2026)

First release.

- **RNZ Data App** template, built on Microsoft's Fabric Apps data app template (fabric-apps-analytic-templates, main branch, October 2026).
- **Theme** (`src/global.css`): RNZ Digital Design System colour roles, Frutiger then Arial, app type scale, 4/8/12/16 radius, grey-tinted shadows, chart series order, pillar accents. Light theme only; dark mode neutralised.
- **Palettes** (`src/data-palette-presets.json`): one preset per pillar, plus a muted preset.
- **Component kit** (`src/components/rnz`): app shell, nav tabs, side nav, page header, card, KPI card, tag, buttons, filter bar, select field, tabs, status message, loading, empty and error states.
- **Agent layer**: RNZ rules block in `AGENTS.md`; pointer files for Copilot and Claude Code; skills `rnz-new-app`, `rnz-app-brand`, `rnz-app-patterns`, `rnz-app-content`, `rnz-app-qa`; Microsoft `app-design` redirected to the RNZ skills.
- **Scripts**: `rnz:check` brand gate (also runs before every deploy build) and `rnz:sync` brand updater.
- Microsoft's sign-in screen and error fallback restyled to RNZ buttons.

Known upstream issues (Microsoft files, not changed): one Vitest spec in `scripts/validate-visual.spec.mjs` fails under the current Vitest ESM rules, and one ESLint rule flags `src/hooks/use-semantic-model-query.ts`. Neither affects the build or the app.
