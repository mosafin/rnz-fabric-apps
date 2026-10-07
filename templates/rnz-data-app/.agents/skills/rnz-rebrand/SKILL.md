---
name: rnz-rebrand
description: >
  Restyle an existing Fabric app that wasn't made from the RNZ template so it matches
  the RNZ Digital Design System, changing the look only and never its data, queries or
  behaviour. Use this whenever someone says "rebrand this app", "make this RNZ",
  "apply the RNZ brand", "restyle this to Ricoh", or opens an app with a dark or
  non-RNZ theme after running update-app.ps1, even if they don't name the skill.
---

# Rebrand an existing app to RNZ

The brand layer (theme, components, skills, brand check) arrives through the update script. This skill moves the app's own screens onto it. The person trusts that their app keeps working exactly as before, so the only thing that changes is how it looks.

## 0. Before you change anything

1. Confirm the brand layer is installed: `rnz/brand-manifest.json`, `src/components/rnz/` and `scripts/rnz-check.mjs` exist. If not, stop and tell the person to run this from PowerShell first, then come back:
   ```powershell
   & "PATH-TO\rnz-fabric-apps\scripts\update-app.ps1" -App "PATH-TO\their-app"
   ```
2. Confirm there's a restore point. If the app is a git repo with uncommitted changes, ask the person to commit first. If it isn't in git, ask them to copy the folder somewhere safe.
3. If the path contains `rnz-fabric-apps/templates/rnz-data-app`, you're in the template source. Stop.

## 1. Rules for this job

- **Look only.** Don't change DAX, queries, data connections, filters, URL parameters, routing, behaviour, or what any label means.
- **Nothing removed.** Keep every view, tab, card, chart and feature, in its current position. Restyle in place.
- **No renames or moves.** Never rename or move a file. References depend on exact names. Ask before deleting anything.
- **Lock-up only.** Remove any other logo the app shows (a logo without the tagline, a typed "RICOH", an SVG or CSS logo, a logo favicon). The only logo is the RICOH lock-up that `<AppShell>` shows. Don't delete the old logo files; list them for the person.
- Follow `rnz-app-brand`, `rnz-app-patterns` and `rnz-app-content` for every visual and wording decision.

## 2. Find what's off-brand

```bash
npm run rnz:check -- --json
```

Group the findings by file. Then find the app's old theme: the update script backed up any brand file it replaced under `rnz/backup/<date>/` (usually the old `src/global.css`). Read it to learn which custom tokens and colours the screens used.

## 3. Map, don't recreate

Map each old token or raw colour to an RNZ token. Never carry an old value across.

| Old | RNZ |
|---|---|
| Dark page or panel backgrounds | `bg-background` (white) or `bg-secondary` (#F5F5F5) |
| Light or white text on dark | `text-foreground` (Ricoh Grey) |
| Brand or accent colours on actions, links, selection | `primary` |
| Accent colours used as decoration | the pillar accent via `<AppShell pillar>`, or remove |
| Status colours and badges | the `StatusMessage` pattern: icon, text and a 4px bar |
| Custom fonts and font links | remove; the theme sets Frutiger then Arial |

## 4. Restyle in place

1. Wrap the app root in `<AppShell>` (it brings the lock-up, header and light theme). Move the app name to `appName` and existing navigation into `nav` without changing its items or order.
2. Where an existing element matches an RNZ component (page header, card, KPI, button, tag, tabs, status, empty or error state), switch to the RNZ component in the same position, with the same text and handlers.
3. Remove any theme toggle and all `dark:` classes.
4. Fix every `rnz:check` error. Fix the warnings, or tell the person in one line why one stays.

## 5. Prove nothing else changed

```bash
npm run lint
npx vitest run src
npm run build:fabric
```

Then follow `rnz-app-qa`, including browser validation at 1280px and 390px. Compare each screen's numbers before and after: they must match.

## 6. Report

Per screen: what changed visually, anything you couldn't map, and any old logo files the person may want to delete. Say "ready to deploy" only when `rnz-app-qa` passes.
