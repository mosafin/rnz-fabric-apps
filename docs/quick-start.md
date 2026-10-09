# Quick start

About five minutes, once per person.

## You need

- Access to the `mosafin/rnz-fabric-apps` repository on GitHub (ask the maintainer)
- Git
- Node.js 20 or later
- VS Code with GitHub Copilot, signed in

To check, open a terminal in VS Code (Terminal > New Terminal) and run `git --version` and `node --version`. Both should print a version, and Node should be 20 or higher.

## 1. Install

In the VS Code terminal, paste:

```powershell
git clone https://github.com/mosafin/rnz-fabric-apps "$HOME/.rnz/rnz-fabric-apps"
node "$HOME/.rnz/rnz-fabric-apps/bin/rnz.mjs" install
```

A GitHub sign-in window may open the first time. This makes a folder called `.rnz` in your user folder. That's the tool's own copy: you never need to open or edit it.

## 2. Reload VS Code

Press `Ctrl + Shift + P`, type `reload window` and press Enter.

## 3. Check it worked

Open Copilot Chat, choose **Agent** mode and type `/rnz`. Five commands should pop up: `/rnz-new`, `/rnz-skin`, `/rnz-update`, `/rnz-agents` and `/rnz-check`.

## 4. Try it

- **New app:** type `/rnz-new` and answer the questions. See [Make a new app](new-app.md).
- **App you already have:** open it in VS Code and type `/rnz-check`. It only reports and changes nothing. See [Re-skin an existing app](existing-app.md).

You never need to install again. The tool and its commands keep themselves up to date.
