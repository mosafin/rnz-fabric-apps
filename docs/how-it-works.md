# How it works

## The pieces

| Piece | Where | What it does |
|---|---|---|
| The tool | `.rnz\rnz-fabric-apps` in your user folder | Does the work. A copy of this GitHub repository |
| The `/rnz-` commands | VS Code's user settings | Tell Copilot what to ask you and what to run |
| The RNZ Data App template | Inside the tool | The starting point for every new app |
| The RNZ skin | Inside the tool | What the tool adds to apps you already have |
| The agents | Inside the tool | Copied into an app's `.claude/agents/` when you ask |

## How updates reach everyone

```
Maintainer's change  ->  GitHub (main)  ->  everyone's tool copy
(pull request)            (merged)           (pulls itself on the next command)
```

Every `/rnz-` command first updates the tool from GitHub, then refreshes the commands in VS Code, then does its job. Nobody reinstalls. Apps themselves only change when someone runs `/rnz-update` on them.

## Why it's safe to run on your app

- **It asks first.** Each command shows what it will do before changing anything.
- **Clean start.** It refuses to run while you have uncommitted work, so your work can't get mixed in.
- **Its own branch.** Changes go on a new branch. Your branch is never touched.
- **Before and after checks.** The skin and updates run your app's build and tests before and after. If anything that passed before now fails, everything is undone automatically.
- **Small, marked edits.** It adds its own files. In your existing files it adds one line or one clearly marked block, and keeps the rest exactly as it was.
- **It never** restructures screens, edits your own CSS or components, renames or deletes your files, pushes, merges or deploys. You do those.

## Where the brand rules come from

| Source | Covers |
|---|---|
| Ricoh Brand Communication Guidelines v6.0 | Logo, typeface, palettes |
| RNZ Brand Colour Chart | The RNZ colour values |
| Ricoh brand methodology v12 (RNZ Digital Design System) | How the brand applies to websites, apps and AI-built screens |

The tool is the working code version of those rules. The lock-up-only logo rule is an RNZ decision for apps and is awaiting APAC brand approval.

## What it doesn't do

- It doesn't decide your screens, data or wording. The rules guide Copilot; you stay in charge.
- It doesn't handle access, permissions or data security. Those follow your organisation's normal processes.
- It only makes Microsoft Fabric data apps from scratch. The skin works on most React and Vite web apps.
