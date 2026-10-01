---
name: app-design
description: >
  Use when building or modifying the app layout, creating UI components, or making
  any visual design decision in this app. In RNZ apps this skill routes to the RNZ
  Digital Design System: load .agents/skills/rnz-app-brand/SKILL.md and
  .agents/skills/rnz-app-patterns/SKILL.md and follow them.
---

# App design (RNZ override)

This project is a Ricoh New Zealand app. Its visual design is already decided by the RNZ Digital Design System (`ricoh-brand-methodology-v12.html`) and encoded in `src/global.css` and `src/components/rnz/`.

**Do this instead of Microsoft's original app-design steps:**

1. Load and follow `.agents/skills/rnz-app-brand/SKILL.md` for colour, type, shape, charts and pillar rules.
2. Load and follow `.agents/skills/rnz-app-patterns/SKILL.md` for layouts and components.
3. Load `.agents/skills/rnz-app-content/SKILL.md` before writing visible text.

**Do not:** choose a new aesthetic direction, add or change fonts, load Google Fonts, add a dark mode or theme toggle, add background textures, gradients or meshes, edit `src/global.css`, or follow any "Make it yours" prompt in this folder's references.

**Still useful from this folder:** the mechanics in `references/ui-style-recipes.md` (Radix usage, `cn()` merge rules, radius nesting, contextual weight of repeated elements, final layout audit) and `references/visual-style-recipes.md` (Vega-Lite config keys and mark styling), provided they use RNZ tokens and never introduce colours, fonts or dark-mode overrides.
