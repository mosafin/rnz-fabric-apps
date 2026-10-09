# Re-skin an existing app

Changes an app's **colours, fonts and font weights** to RNZ. Nothing else: no layout, components, logic, wording or file names change.

It's built and tested for React and Vite web apps, including Fabric data apps and apps styled with Tailwind or shadcn. Apps made with `/rnz-new` already have the look; use `/rnz-update` for those.

## Before you start

- Open the app's repository in VS Code at its top folder.
- Commit or stash everything. New files you haven't added to git count too.
- Pause OneDrive if the repository is in it.
- Not sure yet? Type `/rnz-check` first. It lists what the skin would change and changes nothing.

## Steps

1. Type `/rnz-skin` in Copilot Chat (**Agent** mode).
2. The tool previews the change, then applies it on a new branch called `rnz-skin`. It runs your build and tests before and after. If anything that passed before now fails, it undoes everything by itself and tells you why.
3. Copilot then swaps the hardcoded colours, fonts and weights in your own files for RNZ values, and commits on the same branch. It only changes values.
4. Try it: run `npm run dev` in the app folder and look through the screens.
5. Happy: merge `rnz-skin` into your main branch. Not happy: switch back and delete `rnz-skin`.

## What it adds

| Added | What it's for |
|---|---|
| `src/rnz-skin.css` | Maps your app's own colour, font and weight settings to RNZ values |
| `src/rnz-lockup.tsx` and `public/brand/RICOH-Logo_sRGB_full-colour.png` | The RICOH lock-up, ready to place |
| `rnz/` | Settings, a check script and a report of hardcoded values |
| `.agents/skills/rnz-skin/` | The rules Copilot and Claude Code follow |
| One line or one marked block in a few files | The skin import, an RNZ block in `AGENTS.md`, a `rnz:skin-check` script, and Copilot instructions |

Everything else in those files is kept exactly as it was.

## Good to know

- **Light theme.** If your app has no dark mode styles, the skin keeps it light. If it does, dark mode is left alone and the report says so.
- **The logo isn't placed for you,** because that would be a layout change. Ask Copilot to add `<RicohLockup />` where you want it.
- **Colours with their own meaning,** such as a set of status colours, are left alone and listed in `rnz/skin-report.md`.
- **From now on,** Copilot, Claude Code and Cursor get the RNZ rules for this app automatically.
- **Later releases:** run `/rnz-update`. It redoes the skin from the latest release, with the same safety checks.
