# Ricoh NZ Fabric app templates

Templates for building Microsoft Fabric Apps that look and behave like one Ricoh New Zealand product. Each template carries the RNZ Digital Design System (`ricoh-brand-methodology-v12.html`) as theme tokens, a component kit, agent skills and a brand gate that runs before every deploy.

| Template | Use it for |
|---|---|
| `templates/rnz-data-app` | Dashboards, register explorers and detail views over a Power BI semantic model |

## Make a new app (5 minutes)

1. Get this folder onto your computer (clone the repository, or copy the folder from the shared location).
2. In a terminal, go to where you keep projects and run:

   ```bash
   npm create @microsoft/rayfin@latest -- my-app --template <path to this folder> --workspace "<Fabric workspace name>"
   ```

   Choose **RNZ Data App** if asked.

3. Open `my-app` in VS Code. In Copilot Chat (Agent mode), type:

   > Build this RNZ app. It's for <who> to see <what>. Model: <semantic model share link>. Workspace: <workspace name>. Pillar: <pillar or none>.

4. Sign in when the browser asks. The agent does the rest, then runs the brand check.
5. Deploy with `npx rayfin up` when you're happy.

## Keep existing apps up to date

When the brand layer changes here (see `CHANGELOG.md`), run this inside each app:

```bash
npm run rnz:sync -- --from <path to this folder>            # preview
npm run rnz:sync -- --from <path to this folder> --apply    # update
```

Only brand-managed files change (theme, component kit, RNZ skills, scripts and the RNZ block in `AGENTS.md`). Screens, queries and `App.tsx` are never touched. Edited brand files are backed up first.

## Change the brand layer

Edit the template, not the apps:

1. Change the files in `templates/rnz-data-app` (theme, components, skills or scripts).
2. In that folder run `npm install`, `npm run rnz:check`, `npm test` and `npm run build`.
3. Bump `templateVersion` in `rnz/brand-manifest.json` and `version` in `package.json`, and add a `CHANGELOG.md` entry.
4. Tell app owners to run `rnz:sync`.

If a change comes from the brand guide, update `ricoh-brand-methodology-v12.html` first (keep the file name; skills reference it), then mirror it here.

## Where the rules come from

| Source | Governs |
|---|---|
| Ricoh Brand Communication Guidelines v6.0 | Logo, balloon, typeface, palettes, creative principles |
| RNZ Brand Colour Chart | RNZ hex values |
| `ricoh-brand-methodology-v12.html` | How those apply to websites, apps and AI-built interfaces |
| This template | The working code version of that guide for Fabric Apps |
