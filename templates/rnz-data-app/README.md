# RNZ Data App

A Microsoft Fabric app connected to a Power BI semantic model, styled to the Ricoh New Zealand Digital Design System (`ricoh-brand-methodology-v12.html`). It is Microsoft's data app template with the RNZ brand layer and RNZ agent skills added.

## Getting started

You need Node.js 20 or later, VS Code with GitHub Copilot (Agent mode), and a Fabric workspace you can deploy to.

1. Create the app from the RNZ template (from the folder that will hold your project):

   ```bash
   npm create @microsoft/rayfin@latest -- my-app --template <path to rnz-fabric-apps> --workspace "<workspace name>"
   ```

2. Open the new `my-app` folder in VS Code, open Copilot Chat in **Agent** mode and type:

   > Build this RNZ app. It's for <who> to see <what>. Model: <semantic model share link>. Workspace: <workspace name>. Pillar: <pillar or none>.

   The agent follows `AGENTS.md` and the `rnz-new-app` skill: it connects the model, asks you to sign in once, and builds from the RNZ patterns.

3. Preview inside Fabric: run `npm run dev`, open the app item in your workspace and add `&devUri=http://localhost:5173` to the address.

4. Deploy: `npm run rnz:check`, then `npx rayfin up`, then `npx rayfin up status`.

Add the master RICOH logo file to `public/brand/` when you have it (see the README there). Never type or draw the logo.

## Project structure

| Path | What it is |
|---|---|
| `AGENTS.md` | Agent instructions. The RNZ rules block at the top overrides everything else |
| `.github/copilot-instructions.md`, `CLAUDE.md` | Point Copilot and Claude Code at `AGENTS.md` |
| `.agents/skills/rnz-*` | RNZ skills: `rnz-new-app`, `rnz-app-brand`, `rnz-app-patterns`, `rnz-app-content`, `rnz-app-qa` |
| `.agents/skills/app-design` | Microsoft's design skill, redirected to the RNZ skills |
| `.agents/skills/*` (others) | Microsoft skills for schema discovery, DAX, visuals, validation and the CLIs |
| `src/global.css` | RNZ theme tokens: colour roles, type scale, radius, shadows, chart series, pillar accents. Brand-managed |
| `src/data-palette-presets.json` | Pillar chart palettes and a muted palette. Brand-managed |
| `src/components/rnz/` | RNZ component kit: shell, nav, page header, cards, KPI, buttons, filters, tabs, status and async states. Brand-managed |
| `src/hooks/use-theme.ts` | Forces the light theme. Brand-managed |
| `src/App.tsx` | Your app starts here |
| `src/queries/` | DAX, Vega-Lite specs and query factories (created as you build) |
| `public/brand/` | Master logo file goes here |
| `rnz/brand-manifest.json` | The list of brand-managed files |
| `rnz/brand-lock.json` | Created by `rnz:sync`; lets `rnz:check` spot local edits to brand files |
| `scripts/rnz-check.mjs`, `scripts/rnz-sync.mjs` | Brand gate and brand update scripts |
| `rayfin/rayfin.yml`, `fabric.yaml` | Fabric App and data connection config |

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Local dev server for previewing inside the Fabric portal |
| `npm run build` | Generates the connection config, type-checks and builds |
| `npm run build:fabric` | The build `npx rayfin up` runs. Runs `rnz:check` first, so brand errors stop a deploy |
| `npm run rnz:check` | RNZ brand gate. Add `-- --json` for agent-readable output |
| `npm run rnz:sync -- --from <template> [--apply]` | Pulls the latest RNZ brand layer into this app. Preview by default |
| `npm test` | Unit tests (Vitest) |
| `npm run lint` | ESLint |
| `npm run validate:visual -- <factory.ts>` | Microsoft's visual validation for query factories |

## Rules in one line

Light theme only, no black, tokens only, Frutiger then Arial with no font links, one red primary action per view, sentence case with no eyebrow labels, master logo file only, real data only, NZ English.

Base template © Microsoft Corporation, MIT licence (see `LICENSE`). RNZ brand layer © Ricoh New Zealand Limited.
