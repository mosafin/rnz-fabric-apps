# Agent instructions: rnz-fabric-apps (template source)

This repository is the **source of the RNZ Fabric app templates**. It is not an app.

## If the person wants to build or change an app

Don't do it here. Every app lives in its own folder. Use the RNZ tool (or the `/rnz-new`, `/rnz-skin`, `/rnz-update` and `/rnz-check` Copilot commands it installs):

```powershell
node bin/rnz.mjs new my-app                       # new branded Fabric app in C:\dev\my-app
node bin/rnz.mjs skin "C:\path\to\existing-app"   # preview the RNZ skin; add --apply to apply it
node bin/rnz.mjs update "C:\dev\my-app"           # latest brand layer or skin; add --apply
```

Then open that app's folder in VS Code and work there. Its own `AGENTS.md` takes over. The older `scripts/new-app.ps1` and `scripts/update-app.ps1` still work.

## If the person explicitly asks to maintain the template

Only then change files in this repo, and follow these rules:

1. **Never rename or move a file.** Skills, scripts, the brand check, the sync script and other repos reference exact names, including `ricoh-brand-methodology-v12.html`, `RNZ Tables & Structured Data Design Standard.html` and `RICOH-Logo_sRGB_full-colour.png`. Add new files instead, and ask before deleting any.
2. **The RICOH logo is always the lock-up** (logo with the "imagine. change." tagline). Never add a logo-only file, never crop the tagline off, never use the logo as a favicon.
3. **Brand source of truth:** `ricoh-brand-methodology-v12.html` lives in the `rnz-ai-library` repo. Change it there first, then copy it unchanged to `templates/rnz-data-app/.agents/skills/rnz-app-brand/references/`.
4. After changing any brand-managed file (listed in `templates/rnz-data-app/rnz/brand-manifest.json`), run `node scripts/rnz-lock.mjs` from the repo root.
5. Bump the version in `rnz/brand-manifest.json` (`templateVersion`), `package.json` and the template's `rayfin-template.yml`, and add a `CHANGELOG.md` entry.
6. Before committing, in `templates/rnz-data-app`: `npm ci`, `npm run rnz:check`, `npx vitest run src`, `npm run build:fabric`. From the root: `node scripts/rnz-lock.mjs --verify` and `node scripts/test-skin.mjs`.
7. Changes reach `main` through a pull request. After merging, tag the release (`git tag v1.2.0` then `git push --tags`).
8. NZ English, no em or en dashes in anything people read.
9. **The skin (`skin/`, `bin/rnz.mjs`) changes colours, fonts and font weights only.** It must never restructure an app, edit the app's own CSS or components, rename or delete the app's files, push, merge or deploy. Every edit to an existing app file is one line or one marked `RNZ-SKIN` block. Keep the safety wrapper (clean tree, new branch, build and tests before and after, full undo on regression) and extend `scripts/test-skin.mjs` for anything new.
10. **Self-contained.** Nothing in this repo may need the `rnz-ai-library` repo at run time. Copy what apps need into the template or `skin/`.
11. The `/rnz-` Copilot commands live in `vscode/prompts/`. `{{RNZ_HOME}}` is replaced with the tool's folder when people run `install`; keep it in every command.
