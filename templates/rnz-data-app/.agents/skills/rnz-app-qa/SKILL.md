---
name: rnz-app-qa
description: >
  The finish line for Ricoh NZ (RNZ) Fabric apps: runs the brand gate, build,
  tests and browser validation, then a short brand, accessibility, content and
  data checklist, and reports what passed. Use this before saying any RNZ app
  work is done, before every `npx rayfin up` deploy, when `npm run rnz:check`
  fails, or when someone asks "is this ready", "check this app" or "QA this".
---

# RNZ app QA

A change isn't done until it passes these checks. Run them in order and fix what fails before moving on, because later checks assume earlier ones passed.

## 1. Automated gates

```bash
npm run rnz:check -- --json   # brand gate: errors block the deploy build
npm run lint
npm test
npm run build
```

- **rnz:check errors:** fix every one. The JSON output gives file, line, rule and the fix. Don't weaken the script, rename variables to dodge it, or move raw colours into other files.
- **rnz:check warnings:** fix them, or tell the person in one line why one should stay (for example, two primary buttons that are on separate screens in the same file).
- **brand-managed warning:** someone edited a file the template owns. Don't "fix" it by editing further. Tell the person the change belongs in the RNZ template, and that `npm run rnz:sync -- --from <template> --apply` restores the brand version.
- Lint or test failures in Microsoft files you didn't touch: report them, don't rewrite Microsoft code to silence them.

## 2. Browser validation

Follow Microsoft's `app-validation` skill (Fabric portal embed flow, not bare localhost). Check at 1280px and 390px wide. Prefer the accessibility snapshot over screenshots unless asked.

## 3. Checklist

Report each line as pass, fail or not applicable.

**Files**
- [ ] No existing file renamed or moved (references depend on exact names)

**Brand**
- [ ] Light theme only; no dark surfaces anywhere, including in the Fabric portal's dark mode
- [ ] Red, white and grey dominate; colour used for meaning, not decoration
- [ ] One red primary action per view; others secondary or neutral
- [ ] No eyebrows, no ALL CAPS, sentence case throughout
- [ ] Pillar colour (if any) only as accents
- [ ] The only logo is the RICOH lock-up (with tagline) in `<AppShell>`, at least 80px wide; no logo-only version, no logo favicon, nothing typed or drawn in its place
- [ ] Charts use theme colours; key series red; series beyond five labelled directly

**Accessibility (WCAG 2.2 AA)**
- [ ] Only the passing text pairs from `rnz-app-brand`
- [ ] Visible labels on every field; visible focus on everything
- [ ] Keyboard reaches every control, tabs move with arrow keys, drawers close with Esc
- [ ] 44px targets; nothing below 12px
- [ ] One `h1` per screen, no skipped heading levels
- [ ] Colour never the only signal

**Content**
- [ ] NZ English, no em or en dashes, no colleague names
- [ ] Buttons verb-led and specific; empty and error states say what to do
- [ ] No invented figures or unsourced claims in labels and notes

**Data**
- [ ] Every query uses fields that exist in the model; no duplicate queries
- [ ] Formats follow the model's format strings
- [ ] Loading, empty and error states exist for every data component
- [ ] No mock data, no hardcoded results, no credentials in code
- [ ] No console errors from the app

## 4. Report

Keep it short:

```
RNZ QA: <app name>
Gates: rnz:check <pass/fail> · lint <pass/fail> · tests <pass/fail> · build <pass/fail>
Checklist: <n> pass, <n> fail, <n> n/a
Fixed: <one line per fix>
Still open: <one line per item, with who needs to act>
Ready to deploy: yes / no
```

Only say "ready to deploy" when every gate passes and no checklist item fails. Then deploy with `npx rayfin up` and confirm with `npx rayfin up status`.
