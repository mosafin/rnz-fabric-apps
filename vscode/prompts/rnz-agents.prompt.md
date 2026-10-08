---
agent: agent
description: "RNZ: add the builder, QA or reporter agents to this app (yes or no to each)"
---
Add the Ricoh NZ (RNZ) agents to the app in this workspace. This only adds files. It never changes the app's code.

1. Run in the terminal:

   node "{{RNZ_HOME}}/bin/rnz.mjs" agents "${workspaceFolder}"

   This only reports; it changes nothing. If it lists more than one app folder, ask me which one, then use that folder as APP below. Otherwise APP is the folder it reports. If it says the app doesn't have the RNZ brand layer yet, tell me to run /rnz-skin first and stop.
2. Show me what it reported, then ask me these in one message and wait for my answers:
   - Add a builder agent? (yes/no) It builds and changes features following the RNZ rules.
   - Add a QA agent? (yes/no) It reviews changes and reports problems without fixing them.
   - Add a reporter agent? (yes/no) It only updates the version number and records each change in the change log. If the app already has one (such as VERSIONING.md), it uses that and follows its rules.
3. Run, listing the agents I said yes to, separated by commas (for example `builder,qa,reporter`):

   node "{{RNZ_HOME}}/bin/rnz.mjs" agents "APP" --agents LIST

   It needs a clean git working tree. It makes a new branch, adds the agents and commits them. If it stops, show me why and stop too. If I said no to all three, don't run it.
4. Tell me what was added and how to use the agents: in Copilot Chat, pick them from the agent list; in Claude Code, ask for them by name. Don't merge, push or deploy.
