# Cheat sheet

Type these in Copilot Chat, in **Agent** mode. Each one asks you or shows a preview before it changes anything.

| Command | Use it to | Changes files? |
|---|---|---|
| `/rnz-new` | Create a new branded Fabric app | Creates a new app folder |
| `/rnz-skin` | Put the RNZ look on an app you already have | Yes, on a new branch |
| `/rnz-update` | Bring an app up to the latest RNZ release | Yes, on a new branch |
| `/rnz-agents` | Add the builder, QA or reporter agents | Adds files, on a new branch |
| `/rnz-check` | See what's off brand | No |

## Before a command that changes files

1. Open the app's repository in VS Code at its top folder, and only that repository.
2. Commit or stash your work. The tool stops if anything is uncommitted.
3. If the repository is in OneDrive, pause OneDrive.

## After

- Look at the new branch (`rnz-skin`, `rnz-update-...` or `rnz-agents`) and try the app (`npm run dev`).
- Happy: merge the branch.
- Not happy: switch back to your own branch and delete the new one. Your branch was never touched.

## Agents

| Agent | Does | Never does |
|---|---|---|
| `rnz-builder` | Builds screens and changes, on brand, then runs the checks | Edit brand files, commit, push or deploy |
| `rnz-qa` | Reviews a change and lists the problems | Change any file |
| `rnz-reporter` | Updates the version and adds a change log entry | Change anything else |

Copilot: pick the agent from the agent list. Claude Code: ask for it by name, for example "use rnz-qa".

## Brand rules in one breath

- Red, white and grey. Ricoh Red `#CF142B` for the main action and key emphasis only.
- Text is Ricoh Grey `#666666`, never black.
- Frutiger, then Arial. Weights 300, 400 and 700 only.
- Light theme only.
- The RICOH logo always with its "imagine. change." tagline (the lock-up), at least 80px wide. Never on its own, never as a favicon.
- NZ English, sentence case, no em or en dashes.

## Same commands in a terminal

```powershell
$rnz = "$HOME/.rnz/rnz-fabric-apps/bin/rnz.mjs"
node $rnz new my-app --agents builder,qa      # new app (agents: any of builder,qa,reporter, all or none)
node $rnz skin .                              # preview the skin, changes nothing
node $rnz skin . --apply                      # apply it on a new branch
node $rnz update . --apply                    # latest RNZ release
node $rnz agents . --agents all               # add agents to an existing app
node $rnz check .                             # report only
node $rnz help                                # everything else
```

Run these in the app's folder (that's what the `.` means).
