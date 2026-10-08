---
agent: agent
description: "RNZ: create a new branded Fabric app (ready repo foundation)"
argument-hint: "app name, e.g. pipeline-by-pillar"
---
Create a new Ricoh NZ (RNZ) branded Fabric app with the RNZ tool.

1. App name: ${input:appName:lowercase-with-hyphens}. If it isn't lowercase letters, numbers and hyphens, suggest a valid name and ask me once.
2. Ask me these in one message, then wait for my answers:
   - The Fabric workspace ID (the GUID after /groups/ in the workspace URL). If I say I don't have it, leave it out.
   - Add a builder agent? (yes/no) It builds screens following the RNZ skills.
   - Add a QA agent? (yes/no) It reviews changes and reports problems without fixing them.
   - Add a reporter agent? (yes/no) It only updates the app's version number and records each change in CHANGELOG.md.
3. Run in the terminal (PowerShell or bash). For `--agents`, list the agents I said yes to, separated by commas (for example `builder,qa,reporter`), or `none`. Add `--workspace-id THE-ID` only if I gave one:

   node "{{RNZ_HOME}}/bin/rnz.mjs" new APP-NAME --agents LIST

4. Show me the result. It creates the app in its own folder (C:\dev on Windows), checks the brand, adds the agents I chose, makes the first git commit and opens it in a new VS Code window.
5. Tell me what to do in Copilot Chat (Agent mode) in the new window. If I chose the builder, first pick the rnz-builder agent from the agent list. Then type: "Build this RNZ app. It's for [who] to see [what]. Model: [semantic model share link]. Pillar: [pillar or none]."

Don't change anything in this workspace.
