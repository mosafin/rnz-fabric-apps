# Agents

Three optional helpers that Copilot and Claude Code can use. Add any of them when you make a new app (`/rnz-new` asks), or later with `/rnz-agents`. An existing app needs the RNZ skin first.

| Agent | Does | Never does |
|---|---|---|
| `rnz-builder` | Builds screens and changes following the RNZ rules, then runs the brand check, tests and build | Edit brand files, rename files, commit, push or deploy |
| `rnz-qa` | Reviews a change against the brand, accessibility, wording and data rules and lists the problems | Change any file. It has no editing tools, so the work never checks itself |
| `rnz-reporter` | Updates the version number and adds a plain-English change log entry | Change any other file, commit, push or deploy |

## Use them

- **Copilot:** in Copilot Chat, pick the agent from the agent list (where you choose Agent mode), then ask.
- **Claude Code:** ask for it by name, for example "use rnz-qa to review this change".
- Open the repository at its **top folder**, so the agents can read its rules and change log.
- When QA asks to run `npm` commands, approve them. It needs them to run the checks, and it still can't change files.

A typical loop: ask **rnz-builder** for a change, then **rnz-qa** to review it, then **rnz-reporter** to record it.

## The reporter and your change log

- If the app already has a change log (`VERSIONING.md`, `CHANGELOG.md`, `CHANGES.md` or `HISTORY.md`, in the app folder or at the top of the repository), the reporter uses it and follows its rules.
- If not, it starts a `CHANGELOG.md`.
- A new app with the reporter starts at version 0.1.0. An existing app keeps its version.
- By default, a fix moves the last number (0.1.0 to 0.1.1), a new screen or feature moves the middle number (0.1.1 to 0.2.0), and the first number only moves when you say so.
- If your repository's own rules already make every agent log its changes, you may not need the reporter.

## Where they live

`.claude/agents/` at the top of the repository. Copilot in VS Code and Claude Code both read that folder. Running `/rnz-agents` again refreshes them.
