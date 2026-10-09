---
agent: agent
description: "RNZ: apply the brand skin (colours, fonts, weights) to this existing app without changing its structure"
---
Apply the Ricoh NZ (RNZ) brand skin to the app in this workspace. The skin changes colours, fonts and font weights only. Never restructure the app.

1. Run in the terminal:

   node "{{RNZ_HOME}}/bin/rnz.mjs" skin "${workspaceFolder}"

   This only analyses; it changes nothing. If it lists more than one app folder, ask me which one, then use that folder as APP below. Otherwise APP is the folder it reports.
2. Show me the summary, then run:

   node "{{RNZ_HOME}}/bin/rnz.mjs" skin "APP" --apply

   It needs a clean git working tree. It makes a new branch, adds the skin, runs the app's build and tests before and after, and undoes everything by itself if something that passed before now fails. If it stops, show me why and stop too.
3. If it succeeded, open APP/rnz/skin-report.md and read APP/.agents/skills/rnz-skin/SKILL.md. For each hardcoded colour, font or font weight listed in the app's own files, replace only the value with the suggested token. Change nothing else: no markup, layout, sizes, components, logic, copy or file names. Leave app-specific colour tokens that carry their own meaning (for example status colours) and list them for me.
4. Follow this repository's own rules too (its AGENTS.md, and any change register such as VERSIONING.md).
5. Run: node "{{RNZ_HOME}}/bin/rnz.mjs" check "APP", then the app's build and tests. If anything that passed before fails, undo your step 3 edits (git checkout -- the files you changed) and tell me.
6. Commit on the same branch: "RNZ skin: hardcoded values to tokens". Don't merge, push or deploy.
7. Tell me what changed and how to preview it (usually npm run dev in APP).
