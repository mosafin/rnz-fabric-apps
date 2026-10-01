---
name: rnz-new-app
description: >
  Guided start for a new Ricoh NZ (RNZ) Fabric app from the RNZ Data App template:
  gathers the four inputs, scaffolds, connects the semantic model, signs in, names
  the app and hands over to the build. Use this whenever someone says "start a new
  RNZ app", "build this RNZ app", "set up a Fabric app", "new dashboard in Fabric",
  pastes a semantic model link into a fresh RNZ project, or opens a project whose
  App.tsx still shows "Your app starts here", even if they don't name the skill.
---

# Start a new RNZ Fabric app

The goal is a running, on-brand app connected to the right semantic model, with as few questions and as little waiting as possible. People using this are often not developers, so do the work yourself, explain in one plain line what each step did, and only stop when a person genuinely has to act (signing in, approving a command).

## 1. Get the four inputs in one message

Ask once, all together, and accept whatever they already gave you:

| Input | Why | Example |
|---|---|---|
| What the app is for and who uses it | Drives the layout pattern and the wording | "Sales managers checking pipeline by pillar" |
| Share link to the semantic model | Registers the data connection | `https://app.fabric.microsoft.com/groups/<ws>/semanticmodels/<id>/...` |
| Fabric workspace for the app | Where `rayfin up` deploys it | Workspace name or URL |
| Pillar, if the app belongs to one | Sets the accent colour | Workplace Experience, Workflow and Automation, Cloud and IT, Cybersecurity, Print and Device Management, or none |

Don't ask them to describe the model's tables or measures. Discover them (Microsoft `schema-discovery` skill).

## 2. Scaffold (skip if the project already exists)

If you're already inside a project made from this template (it has `rnz/brand-manifest.json`), skip to step 3.

Otherwise, from the parent folder:

```bash
npm create @microsoft/rayfin@latest -- <app-name> --template <path to the rnz-fabric-apps folder> --workspace "<workspace name>"
```

Pick **RNZ Data App** if the picker appears. Use a kebab-case app name, for example `pipeline-by-pillar`. Then open the new folder in VS Code and continue there, reading its `AGENTS.md` first.

## 3. Connect the semantic model

```bash
npm install
npx fabric-app-data add <alias> --from-url "<share link>"
npx fabric-app-data generate -o src/fabric.generated.ts
```

Use a short camelCase alias that names the data, such as `pipelineModel`. Register only the model the person gave you. Never add a second source without asking. The Microsoft `fabric-cli` skill has the full command reference.

## 4. Sign in

```bash
npx rayfin login
```

Pause and tell the person: "A browser window will ask you to sign in to Fabric. Tell me when you're done." Continue only after they confirm.

## 5. Name and brand the app

1. Set the app name in two places: `appName` on `<AppShell>` in `src/App.tsx`, and `<title>` in `index.html`. Sentence case, plain words, no "Dashboard 2.0" style names.
2. Set `pillar` on `<AppShell>` if the app belongs to one pillar. Leave it off for cross-pillar or general apps.
3. Logo: if `public/brand/` holds a master RICOH logo file, set `LOGO_SRC` in `src/App.tsx`. If not, leave it unset and tell the person once that the logo appears after they add the supplied file. Never type, draw or approximate it.

Don't touch `src/global.css` or anything else listed in `rnz/brand-manifest.json`. Those files carry the brand.

## 6. Hand over to the build

Summarise in three lines what's set up (app name, model alias, workspace), then ask the one question that unlocks the build: what the main screen should answer. Then follow the build order in `AGENTS.md`: discover the schema, validate queries, then `rnz-app-brand`, `rnz-app-patterns` and `rnz-app-content`.

## 7. Preview and deploy (when the build is ready)

Preview inside Fabric (the template doesn't work on bare localhost):

```bash
npm run dev
```

Then open the app item in the Fabric workspace and add `&devUri=http://localhost:5173` to the address.

Deploy:

```bash
npm run rnz:check
npx rayfin up --workspace "<workspace name>"
npx rayfin up status
```

`rnz:check` also runs automatically inside the deploy build, so a brand error stops the deploy. Give the person the Fabric portal link from the output. If a query fails after deploying, check the connection and the person's access to the model; never swap in mock data.

## If something stops you

| Symptom | Do this |
|---|---|
| Sign-in fails, or deploy returns 401 or 403 | Run `npx rayfin login` again, then retry |
| The app item or the deploy is refused for the workspace | Tell the person in one line; access to Fabric Apps is set up by others. Carry on building locally |
| Queries fail with a permission error | The person needs Build and Read on the model. Say so plainly and stop the data work |
| `rnz:check` fails | Load `rnz-app-qa` and fix the listed errors |
