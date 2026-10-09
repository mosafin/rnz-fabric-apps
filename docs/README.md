# RNZ tool documentation

The RNZ tool gives apps built in VS Code the Ricoh New Zealand (RNZ) look, and keeps them that way. It makes new branded Microsoft Fabric apps, and re-skins apps you already have (colours, fonts and font weights only) without breaking them.

## Start here

| I want to | Read |
|---|---|
| Set it up for the first time (about 5 minutes) | [Quick start](quick-start.md) |
| See every command on one page | [Cheat sheet](cheat-sheet.md) |
| Make a new branded app | [Make a new app](new-app.md) |
| Put the RNZ look on an app I already have | [Re-skin an existing app](existing-app.md) |
| Add the builder, QA or reporter agents | [Agents](agents.md) |
| Fix something that went wrong | [Troubleshooting](troubleshooting.md) |
| Understand what it changes and why it's safe | [How it works](how-it-works.md) |
| Look after the tool | [Maintainers](maintainers.md) |

## In one minute

- You type `/rnz-` commands in Copilot Chat. The tool does the work.
- New app: `/rnz-new`. App you already have: `/rnz-skin`. Keep it current: `/rnz-update`. Agents: `/rnz-agents`. Check only: `/rnz-check`.
- Anything that changes files happens on a new git branch. You look, then merge when you're happy.
- The tool and its commands update themselves from GitHub every time you use them.
