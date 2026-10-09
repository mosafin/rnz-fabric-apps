# Changelog

All brand-layer changes are listed here. After a release, run `/rnz-update` in each app (or `node bin/rnz.mjs update APP --apply`).

## Documentation (October 2026)

New `docs/` folder: quick start, cheat sheet, guides for new apps, existing apps and agents, troubleshooting, how it works, and a maintainers page. No change to the tool or template, so no version change.

## 1.2.0 (October 2026)

- **RNZ tool (`bin/rnz.mjs`) and Copilot commands.** One-time setup per person (`install`), then `/rnz-new`, `/rnz-skin`, `/rnz-update` and `/rnz-check` in Copilot Chat. Works from a private GitHub repo with normal git sign-in and keeps itself up to date. No dependencies beyond Node 20 and git.
- **RNZ skin for existing apps.** Changes colours, fonts and font weights only, without restructuring: an unlayered `src/rnz-skin.css` maps the app's own tokens (Tailwind v4, Microsoft Fabric data app and shadcn names) to RNZ values, plus the lock-up component and file, the `rnz-skin` skill, a skin check and a report of hardcoded values for a Copilot values-only pass. It works on a new branch, runs the app's build and tests before and after, and undoes itself completely on any regression. Copilot, Claude Code and Cursor get the rules through marked blocks and `.github/instructions/`, including for apps in a subfolder of a bigger repo. Tested on a copy of Content Shelf Mark (RNZ-GTM-Agent): build and all 36 tests pass before and after, no layout change.
- **Optional builder, QA and reporter agents.** `/rnz-new` asks yes or no for each, and the new `/rnz-agents` adds them to an existing app with the RNZ skin or from the template (only adds files, on a new branch). They go in the repository's `.claude/agents/`, read by Copilot in VS Code and by Claude Code. `rnz-builder` builds following the RNZ rules; `rnz-qa` reviews and reports problems without fixing them (it has no edit tools); `rnz-reporter` only updates the version and adds a change log entry, using the app's existing change log (such as `VERSIONING.md`) and its rules, or starting `CHANGELOG.md`. New apps with the reporter start at 0.1.0 instead of the template's version. Skinned apps get versions scoped to the app's folder with its own checks. Tested by `scripts/test-agents.mjs`; tried on a copy of the GTM repo, where the reporter followed `VERSIONING.md` (0.3.5 to 0.3.6) and changed nothing else.
- **The `/rnz-` commands keep themselves current.** Every tool command refreshes the command files in VS Code (adding new ones too), so a release that changes a command reaches everyone without running `install` again. It only touches commands installed from that copy of the tool. `new` and `agents` now also update the tool first, like the other commands.
- **Fabric DataGrid header** (template and skin): 2px Ricoh Red rule under the header, bold grey headings, and number column headings right-aligned like their numbers.
- **Template checks** now also run `scripts/test-skin.mjs`.
- No change for apps made from the template other than the DataGrid header; update with `/rnz-update`.

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
