# Troubleshooting

Find the message or symptom, then follow the fix.

## Setting up

**`git clone` says "Repository not found" or asks for access**
You don't have access yet, or you're signed in to the wrong GitHub account. Ask the maintainer to add you, then try again.

**"Node ... is too old"**
Install Node.js 20 or later, close and reopen VS Code, then run the command again.

**The `/rnz` commands don't show in Copilot Chat**
Reload VS Code (`Ctrl + Shift + P`, then `reload window`). Make sure Copilot Chat is in **Agent** mode. Still missing? Run the install line again:
```powershell
node "$HOME/.rnz/rnz-fabric-apps/bin/rnz.mjs" install
```

## Running a command

**"The repository has uncommitted changes"**
Commit your work, or put it aside with `git stash -u` (bring it back later with `git stash pop`). Then run the command again.

**"Deletion of directory ... failed. Should I try again? (y/n)"**
Something has the folder open, usually OneDrive syncing or the app's preview (`npm run dev`). Type `n` and press Enter: git finishes without that folder. Next time, pause OneDrive and stop the preview first.

**Copilot ran the command in the wrong repository**
This happens when VS Code has several repositories open. Open only the app's repository, or run git commands yourself in the terminal with the folder spelled out, for example `git -C "C:\path\to\repo" status`.

**"More than one app found" or "No web app found"**
Point the command at the app's own folder (the one with its `package.json`). Copilot asks you which one when there are several.

**"... doesn't have the RNZ brand layer yet" (from `/rnz-agents`)**
The agents need the RNZ skin. Run `/rnz-skin` first. If you already did, check you're on the branch that has it: `git branch --show-current`.

**"... was undone, because something that worked before stopped working"**
The safety check worked: nothing was changed and you're back on your own branch. Send the full message to the maintainer.

**"Note: couldn't get the latest RNZ tool"**
You're offline, or someone edited the tool's own copy. The command still runs on the copy you have. To reset the tool's copy (this only affects the tool, never your apps):
```powershell
git -C "$HOME/.rnz/rnz-fabric-apps" fetch
git -C "$HOME/.rnz/rnz-fabric-apps" reset --hard origin/main
```

## Agents

**The agents don't show in Copilot's agent list**
Open the repository at its top folder, then reload VS Code. The agents are files in `.claude/agents/` there.

**QA keeps asking to run commands**
That's expected. Approve the `npm` and `git` commands so it can run the checks. It still can't change files.

## Older PowerShell scripts

**"... is not digitally signed" or "running scripts is disabled"**
That's from the older `scripts/new-app.ps1` and `scripts/update-app.ps1`. Use the `/rnz-` commands instead, or unblock the file with `Unblock-File`.

Still stuck? Send the maintainer the command you ran and everything it printed.
