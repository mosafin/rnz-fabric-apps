# Agent instructions: rnz-fabric-apps (template source)

This repository is the **source of the RNZ Fabric app templates**. It is not an app.

## If the person wants to build or change an app

Don't do it here. Every app lives in its own folder, created from this template:

```powershell
& ".\scripts\new-app.ps1" -Name my-app -WorkspaceId 00000000-0000-0000-0000-000000000000
```

To bring the brand to an app that already exists:

```powershell
& ".\scripts\update-app.ps1" -App "C:\dev\my-app"
```

Then open that app's folder in VS Code and work there. Its own `AGENTS.md` takes over.

## If the person explicitly asks to maintain the template

Only then change files in this repo, and follow these rules:

1. **Never rename or move a file.** Skills, scripts, the brand check, the sync script and other repos reference exact names, including `ricoh-brand-methodology-v12.html`, `RNZ Tables & Structured Data Design Standard.html` and `RICOH-Logo_sRGB_full-colour.png`. Add new files instead, and ask before deleting any.
2. **The RICOH logo is always the lock-up** (logo with the "imagine. change." tagline). Never add a logo-only file, never crop the tagline off, never use the logo as a favicon.
3. **Brand source of truth:** `ricoh-brand-methodology-v12.html` lives in the `rnz-ai-library` repo. Change it there first, then copy it unchanged to `templates/rnz-data-app/.agents/skills/rnz-app-brand/references/`.
4. After changing any brand-managed file (listed in `templates/rnz-data-app/rnz/brand-manifest.json`), run `node scripts/rnz-lock.mjs` from the repo root.
5. Bump the version in `rnz/brand-manifest.json` (`templateVersion`), `package.json` and the template's `rayfin-template.yml`, and add a `CHANGELOG.md` entry.
6. Before committing, in `templates/rnz-data-app`: `npm ci`, `npm run rnz:check`, `npx vitest run src`, `npm run build:fabric`. From the root: `node scripts/rnz-lock.mjs --verify`.
7. Changes reach `main` through a pull request. After merging, tag the release (`git tag v1.1.0` then `git push --tags`).
8. NZ English, no em or en dashes in anything people read.
