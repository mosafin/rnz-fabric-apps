# Ricoh NZ Fabric app templates

Templates for building Microsoft Fabric Apps that look and behave like one Ricoh New Zealand product. Each template carries the RNZ Digital Design System (`ricoh-brand-methodology-v12.html`) as theme tokens, a component kit with the RICOH lock-up built in, agent skills, and a brand check that runs before every deploy.

| Template | Use it for |
|---|---|
| `templates/rnz-data-app` | Dashboards, register explorers and detail views over a Power BI semantic model |

You never work inside this repo. You clone it once, and the scripts below create and update apps in their own folders.

## Make a new app

1. Clone this repo once (later, the script pulls updates for you).
2. In PowerShell, from this repo's folder (replace the name and the workspace ID; never type angle brackets):

   ```powershell
   .\scripts\new-app.ps1 -Name pipeline-by-pillar -WorkspaceId 00000000-0000-0000-0000-000000000000
   ```

   The workspace ID is the GUID after `/groups/` in the workspace's URL. The script creates the app in `C:\dev` (outside OneDrive), checks the brand and opens VS Code.

3. In Copilot Chat (Agent mode):

   > Build this RNZ app. It's for [who] to see [what]. Model: [semantic model share link]. Pillar: [pillar or none].

4. Deploy with `npx rayfin up` when you're happy.

## Update an app, or rebrand one made elsewhere

```powershell
.\scripts\update-app.ps1 -App C:\dev\pipeline-by-pillar
```

It previews first, then only changes brand-managed files (theme, component kit, RNZ skills, scripts, the RICOH lock-up and the RNZ block in `AGENTS.md`). Screens, queries and `App.tsx` are never touched, files are never renamed or deleted, and anything replaced is backed up in the app's `rnz/backup/` folder.

For an app that wasn't made from this template, run the same script, then ask Copilot in that app: "Rebrand this app to RNZ. Change the look only."

## Rules that never change

- **The RICOH logo is always the lock-up** (logo with the "imagine. change." tagline), at least 80px wide. Never the logo alone, never a logo favicon. (RNZ decision; for apps it departs from global guidelines §3.3.9 and needs APAC brand approval.)
- **File names never change.** Skills, scripts and other repos reference exact names, including `ricoh-brand-methodology-v12.html`, `RNZ Tables & Structured Data Design Standard.html` and `RICOH-Logo_sRGB_full-colour.png`.
- **The brand guide's source of truth is the `rnz-ai-library` repo.** This repo carries a copy for the skills.

## Change the brand layer (maintainers)

Follow the root `AGENTS.md`. In short: change the template, run `node scripts/rnz-lock.mjs`, bump the version, add a `CHANGELOG.md` entry, open a pull request (the Template checks workflow must pass), merge, then tag the release.

## Where the rules come from

| Source | Governs |
|---|---|
| Ricoh Brand Communication Guidelines v6.0 | Logo, balloon, typeface, palettes, creative principles |
| RNZ Brand Colour Chart | RNZ hex values |
| `ricoh-brand-methodology-v12.html` (in `rnz-ai-library`) | How those apply to websites, apps and AI-built interfaces, including the RNZ lock-up-only rule |
| This template | The working code version of that guide for Fabric Apps |
| `UPSTREAM.md` | Which Microsoft template version this is built on |
