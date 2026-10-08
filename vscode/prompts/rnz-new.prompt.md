---
agent: agent
description: "RNZ: create a new branded Fabric app (ready repo foundation)"
argument-hint: "app name, e.g. pipeline-by-pillar"
---
Create a new Ricoh NZ (RNZ) branded Fabric app with the RNZ tool.

1. App name: ${input:appName:lowercase-with-hyphens}. If it isn't lowercase letters, numbers and hyphens, suggest a valid name and ask me once.
2. Ask me once for the Fabric workspace ID (the GUID after /groups/ in the workspace URL). If I say I don't have it, leave it out.
3. Run in the terminal (PowerShell or bash), adding `--workspace-id THE-ID` only if I gave one:

   node "{{RNZ_HOME}}/bin/rnz.mjs" new APP-NAME

4. Show me the result. It creates the app in its own folder (C:\dev on Windows), checks the brand, makes the first git commit and opens it in a new VS Code window.
5. Tell me what to type in Copilot Chat (Agent mode) in the new window: "Build this RNZ app. It's for [who] to see [what]. Model: [semantic model share link]. Pillar: [pillar or none]."

Don't change anything in this workspace.
