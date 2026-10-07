# GitHub Copilot instructions

This is a Ricoh New Zealand Fabric data app. Read `AGENTS.md` at the project root before doing anything else, and follow it. The RNZ rules block at the top of `AGENTS.md` overrides everything else, including Microsoft's skills and your own design defaults.

Skills live in `.agents/skills/`. Load the RNZ skills named in `AGENTS.md` at the moments it lists:

- `rnz-new-app`: starting a new app
- `rnz-app-brand`: before any presentation code
- `rnz-app-patterns`: choosing layouts and components
- `rnz-app-content`: writing any visible text
- `rnz-app-qa`: before saying you're done and before deploying
- `rnz-rebrand`: restyling an app that wasn't made from this template

Short version of the rules: light theme only, no black, tokens only, Frutiger then Arial with no font links, one red primary action per view, sentence case with no eyebrow labels, the RICOH logo only ever as the lock-up with its tagline (built into `<AppShell>`), no renamed files, real data only, NZ English. Run `npm run rnz:check` before finishing.
