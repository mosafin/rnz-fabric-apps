---
agent: agent
description: "RNZ: check this app against the RNZ brand (report only, changes nothing)"
---
Run the Ricoh NZ (RNZ) brand check on the app in this workspace. Change nothing.

1. Run in the terminal:

   node "{{RNZ_HOME}}/bin/rnz.mjs" check "${workspaceFolder}"

2. Summarise the result in plain English: what passes, what needs fixing, and for each finding the file, line and suggested token. Don't fix anything unless I ask.
