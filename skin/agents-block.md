## RNZ skin (read first)

This app uses the **Ricoh New Zealand (RNZ) brand skin** from rnz-fabric-apps. The skin changes how
the app looks (colours, fonts and font weights) and nothing else. When you add or change UI here:

1. **Use the app's tokens or the RNZ variables, never new hardcoded values.** Colours come from
   classes such as `bg-primary`, `text-foreground`, `bg-card`, `bg-muted`, `border-border`, or from
   `var(--rnz-red)`, `var(--rnz-grey)`, `var(--rnz-light)`, `var(--rnz-border)`. No hex, rgb or
   Tailwind palette colours (`bg-blue-600`, `text-gray-700`).
2. **No black or near-black.** All text is Ricoh Grey #666666. White text only on red or grey.
3. **Frutiger, then Arial.** Never add Google Fonts or any font link. Weights 300, 400 and 700 only.
4. **Light theme.** Red for the one primary action and key emphasis only.
5. **The RICOH logo is always the lock-up** (logo with tagline), via `<RicohLockup />` from
   `src/rnz-lockup.tsx`, at least 80px wide. Never the logo alone, never a favicon.
6. **Don't restructure for brand.** Brand fixes change values only, never layout or behaviour.
7. **Never edit or rename** `src/rnz-skin.css`, `src/rnz-lockup.tsx`, `rnz/` or
   `public/brand/RICOH-Logo_sRGB_full-colour.png`. They're managed by the RNZ skin tool.
8. Before finishing UI work, run `npm run rnz:skin-check`.

Details: `.agents/skills/rnz-skin/SKILL.md`. This block is managed by the RNZ skin tool; edit
outside the markers only.
