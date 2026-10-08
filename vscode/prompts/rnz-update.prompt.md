---
agent: agent
description: "RNZ: update this app to the latest RNZ brand layer or skin"
---
Update the app in this workspace to the latest Ricoh NZ (RNZ) brand release.

1. Run in the terminal:

   node "{{RNZ_HOME}}/bin/rnz.mjs" update "${workspaceFolder}"

   It works out whether the app was made from the RNZ template (brand layer) or has the RNZ skin, and previews the changes. If it lists more than one app folder, ask me which one and run it again with that folder.
2. Show me the preview and ask me to confirm. Then run the same command with --apply added.
3. Show me the result, including the build and test results. Don't merge, push or deploy.
