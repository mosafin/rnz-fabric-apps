# Ricoh NZ Fabric app templates and brand skin

One place for the Ricoh New Zealand (RNZ) look in apps built with VS Code and Copilot:

- **New app:** a ready Microsoft Fabric app repo with the RNZ Digital Design System built in: theme, component kit with the RICOH lock-up, agent skills and a brand check before every deploy.
- **Existing app:** the **RNZ skin** changes colours, fonts and font weights to RNZ, and nothing else. No layout, component, logic or file-name changes. It works on its own branch, checks the app's build and tests before and after, and undoes itself if anything that worked stops working.

After either one, Copilot (and Claude Code or Cursor) automatically gets the RNZ rules for that app, so new work stays on brand without repeated corrections.

Everything the tool needs is in this repo. It doesn't need the `rnz-ai-library` repo.

## Set up (once per person, about two minutes)

You need Git, Node.js 20 or later, VS Code with GitHub Copilot, and access to this repo on GitHub (ask the maintainer).

In VS Code, open a terminal (Terminal > New Terminal) and paste:

```powershell
git clone https://github.com/mosafin/rnz-fabric-apps "$HOME/.rnz/rnz-fabric-apps"
node "$HOME/.rnz/rnz-fabric-apps/bin/rnz.mjs" install
```

The first line may open a GitHub sign-in window. Then reload VS Code (Command Palette > Developer: Reload Window).

## Use it

Open Copilot Chat, switch to **Agent** mode, and type:

| Type | What happens |
|---|---|
| `/rnz-new` | Asks for a name, a Fabric workspace ID (optional) and which agents you want (yes or no to each), creates a branded app in `C:\dev\NAME`, makes the first commit and opens it. |
| `/rnz-skin` | Applies the RNZ skin to the app open in VS Code, then has Copilot swap any hardcoded colours, fonts and weights for RNZ tokens, values only. |
| `/rnz-update` | Brings the open app up to the latest RNZ release, whether it was made from the template or has the skin. |
| `/rnz-agents` | Adds the builder, QA or reporter agents (yes or no to each) to the open app, which must have the RNZ skin or be made from the template. Only adds files, on a new branch. |
| `/rnz-check` | Reports anything off brand. Changes nothing. |

The tool updates itself from GitHub every time you use it, and refreshes the `/rnz-` commands in VS Code at the same time, so everyone stays on the latest release without reinstalling. If a command looks out of date, reload VS Code.

Without Copilot, the same commands work in a terminal:

```powershell
node "$HOME/.rnz/rnz-fabric-apps/bin/rnz.mjs" skin .            # preview only
node "$HOME/.rnz/rnz-fabric-apps/bin/rnz.mjs" skin . --apply    # apply on a new branch
node "$HOME/.rnz/rnz-fabric-apps/bin/rnz.mjs" new my-app
node "$HOME/.rnz/rnz-fabric-apps/bin/rnz.mjs" help
```

## Optional agents

`/rnz-new` asks three yes or no questions, and `/rnz-agents` asks the same for an existing app. Each yes adds one agent to the repository's `.claude/agents/`. Copilot in VS Code shows them in the agent list; Claude Code uses them by name.

| Agent | What it does | What it never does |
|---|---|---|
| `rnz-builder` | Builds and changes screens following the RNZ skills, then runs the brand check, tests and build | Edit brand-managed files, rename files, commit, push or deploy |
| `rnz-qa` | Reviews the change against the brand, accessibility, content and data rules, and lists the problems | Fix anything (it can't edit files), so the work never checks itself |
| `rnz-reporter` | Updates the app's version number and adds a plain-English entry to `CHANGELOG.md` | Change any other file, commit, push or deploy |

The reporter uses the change log the app already has (`VERSIONING.md`, `CHANGELOG.md`, `CHANGES.md` or `HISTORY.md`, in the app folder or the repository root) and follows its rules for entries and versions. Only if there's none does it start a `CHANGELOG.md`. A new app with the reporter starts at version 0.1.0; an existing app keeps its version.

For an app with the RNZ skin, the builder and QA follow the skin rules and run the app's own checks (skin check, lint, tests, build). For an app in a subfolder of a bigger repo, the agents are told which folder they work in. Open the repository at its root, so the agents can read the repository's own rules and change log.

By default, a fix moves the last number (0.1.0 to 0.1.1), a new screen or feature moves the middle one (0.1.1 to 0.2.0), and the first number moves only when you say so.

In a terminal: `node "$HOME/.rnz/rnz-fabric-apps/bin/rnz.mjs" new my-app --agents builder,qa,reporter` (or `all`, or `none`, the default), or for an existing app `... agents "C:\path\to\app" --agents all`.

## What the skin does to an existing app

**Adds** (new files the tool manages): `src/rnz-skin.css` (maps the app's own colour, font and weight tokens to RNZ values), `src/rnz-lockup.tsx` (the RICOH lock-up, ready to place), `public/brand/RICOH-Logo_sRGB_full-colour.png`, `rnz/` (settings, a check script and a report of hardcoded values), and the `rnz-skin` agent skill.

**Changes, one line or one marked block each:** the app's entry file (one import line), its `AGENTS.md` (an RNZ block at the top), `package.json` (an `rnz:skin-check` script, only if missing), and in the repository: `.github/copilot-instructions.md`, `.github/instructions/` and, for apps in a subfolder, a short pointer block at the end of the repo's own `AGENTS.md` or `CLAUDE.md`. Everything else in those files is kept exactly.

**Never:** restructures screens, edits the app's own CSS or components (Copilot's follow-up pass only swaps values, on the same branch, and you review it), renames or deletes files, pushes, merges or deploys.

**Safety:** it needs a clean git working tree, works on a new `rnz-skin` branch, runs the app's build and tests before and after, and if anything that passed before now fails, it removes everything it added, returns you to your branch and deletes its own. You merge when you're happy.

**Light theme:** RNZ apps are light only. If the app's components don't use `dark:` classes, the skin keeps it light even when the host switches to dark mode. If they do, dark mode is left alone and the report says so.

## Share it with the team (maintainer)

- The repo is private. Give people read access: on GitHub, **Settings > Collaborators > Add people**. For a larger group, move the repo to a GitHub organisation and give a team read access.
- Releases go through a pull request; the **Template checks** workflow must pass (it tests the template and the skin tool). Merge, then tag the release. Everyone gets it the next time they run an `/rnz-` command.
- Your own clone (for example in your GitHub folder) is for maintaining the repo. Team members only need the copy in `~/.rnz`.
- **Test a release before merging:** clone its branch into `~/.rnz` and install from there: `git clone -b release/1.2.0 https://github.com/mosafin/rnz-fabric-apps "$HOME/.rnz/rnz-fabric-apps"`, then `node "$HOME/.rnz/rnz-fabric-apps/bin/rnz.mjs" install`. It keeps itself up to date with that branch. After merging, switch it back with `git -C "$HOME/.rnz/rnz-fabric-apps" checkout main`.

## Rules that never change

- **The RICOH logo is always the lock-up** (logo with the "imagine. change." tagline), at least 80px wide. Never the logo alone, never a logo favicon. (RNZ decision; for apps it departs from global guidelines §3.3.9 and needs APAC brand approval.)
- **File names never change.** Skills, scripts and other repos reference exact names, including `ricoh-brand-methodology-v12.html`, `RNZ Tables & Structured Data Design Standard.html` and `RICOH-Logo_sRGB_full-colour.png`.
- **This repo works on its own.** The brand guide's source of truth is the `rnz-ai-library` repo; this repo carries the copy the skills use, so apps never need the library.

## What's in this repo

| Path | What it is |
|---|---|
| `bin/rnz.mjs` | The RNZ tool: `install`, `new`, `skin`, `update`, `check` |
| `skin/` | What the skin adds to existing apps: the check script, the `rnz-skin` skill, agent blocks and the lock-up component |
| `agents/` | The optional builder, QA and reporter agents that `new` and `agents` add to an app (`agents/skin/` holds the versions for skinned apps) |
| `vscode/prompts/` | The `/rnz-` Copilot commands (`install` copies them into VS Code) |
| `templates/rnz-data-app` | The RNZ Data App template for new Fabric apps |
| `scripts/` | Maintainer scripts: `rnz-lock.mjs`, `test-skin.mjs`, `test-agents.mjs`, and the older PowerShell `new-app.ps1` and `update-app.ps1` (still work) |

## Change the brand layer (maintainers)

Follow the root `AGENTS.md`. In short: change the template or `skin/`, run `node scripts/rnz-lock.mjs`, `node scripts/test-skin.mjs` and `node scripts/test-agents.mjs`, bump the version, add a `CHANGELOG.md` entry, open a pull request (Template checks must pass), merge, then tag the release.

## Where the rules come from

| Source | Governs |
|---|---|
| Ricoh Brand Communication Guidelines v6.0 | Logo, balloon, typeface, palettes, creative principles |
| RNZ Brand Colour Chart | RNZ hex values |
| `ricoh-brand-methodology-v12.html` (source in `rnz-ai-library`, copy in the template's skills) | How those apply to websites, apps and AI-built interfaces, including the RNZ lock-up-only rule |
| This repo | The working code version of that guide for Fabric Apps and existing apps |
| `UPSTREAM.md` | Which Microsoft template version this is built on |
