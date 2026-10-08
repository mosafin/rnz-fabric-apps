---
applyTo: "{{GLOB}}"
description: "RNZ brand skin rules for UI files (managed by the RNZ skin tool, rnz-fabric-apps)"
---

These files belong to an app with the Ricoh New Zealand (RNZ) brand skin. Keep every change on
brand without changing structure:

- Colours only from the app's tokens (`bg-primary`, `text-foreground`, `bg-card`, `bg-muted`,
  `border-border`) or the RNZ variables (`var(--rnz-red)`, `var(--rnz-red-pressed)`,
  `var(--rnz-grey)`, `var(--rnz-white)`, `var(--rnz-light)`, `var(--rnz-border)`). No hex, rgb, hsl
  or Tailwind palette colours. No black or near-black: text is Ricoh Grey #666666.
- Fonts: inherit the page font or use `var(--rnz-font)` (Frutiger, then Arial). Never add font links.
- Weights: 300, 400 or 700 only.
- Light theme. Red for the one primary action and key emphasis only.
- The RICOH logo is only ever the lock-up, through `<RicohLockup />`, at least 80px wide.
- Brand fixes change values only, never markup, layout, logic or file names.
- Never edit `rnz-skin.css`, `rnz-lockup.tsx` or anything in `rnz/`.

Full rules: the app's `.agents/skills/rnz-skin/SKILL.md`.
