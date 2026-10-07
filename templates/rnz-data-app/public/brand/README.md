# RICOH lock-up

`RICOH-Logo_sRGB_full-colour.png` is the master RICOH lock-up: the RICOH logo with the "imagine. change." tagline below it. It is brand-managed, and `<AppShell>` shows it in every app header automatically.

## Rules (RNZ decision, ricoh-brand-methodology-v12.html, Section 03)

- **Always the lock-up.** RNZ never shows the RICOH logo without the tagline, at any size, in any app, page or document.
- **At least 80px wide.** The header shows it 40px tall, about 92px wide. Never smaller. Where it can't fit at 80px wide (favicons, tiny UI), show no logo at all.
- **Master artwork only.** Never retype, redraw, crop, recolour, stretch, animate or rebuild it in HTML, CSS or SVG. Never cut the tagline off to make a logo-only version.
- **Protected area.** Keep 0.6X clear on all sides, where X is the height of the "H". Nothing else inside it.
- **Never on the Imagination Balloon**, and never combined with other shapes to make an app icon.
- **On Ricoh Red or strong colour,** use the solid white master lock-up. Ask the brand team for it; don't make one.
- **File names never change.** Keep `RICOH-Logo_sRGB_full-colour.png` exactly as it is. Skills, `src/components/rnz/brand-assets.ts`, the brand check and the sync script all use this name.
- A new app icon or co-branded mark needs APAC brand approval before release.
- The lock-up-only rule for apps departs from the global guidelines (§3.3.9 lists the logo without tagline for software and service portals). It needs APAC brand approval; see ricoh-brand-methodology-v12.html, Section 16. If it changes, only `src/components/rnz/brand-assets.ts` and the master file change, and every app gets it through the update script.

Don't add other logo files to this folder. The brand check (`npm run rnz:check`) fails if it finds one.
