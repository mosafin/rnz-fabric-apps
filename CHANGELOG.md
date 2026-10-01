# Changelog

All brand-layer changes are listed here. After updating the template, run `npm run rnz:sync -- --from <path to this folder> --apply` in each app.

## 1.0.0 (2 October 2026)

First release.

- **RNZ Data App** template, built on Microsoft's Fabric Apps data app template (fabric-apps-analytic-templates, main branch, October 2026).
- **Theme** (`src/global.css`): RNZ Digital Design System colour roles, Frutiger then Arial, app type scale, 4/8/12/16 radius, grey-tinted shadows, chart series order, pillar accents. Light theme only; dark mode neutralised.
- **Palettes** (`src/data-palette-presets.json`): one preset per pillar, plus a muted preset.
- **Component kit** (`src/components/rnz`): app shell, nav tabs, side nav, page header, card, KPI card, tag, buttons, filter bar, select field, tabs, status message, loading, empty and error states.
- **Agent layer**: RNZ rules block in `AGENTS.md`; pointer files for Copilot and Claude Code; skills `rnz-new-app`, `rnz-app-brand`, `rnz-app-patterns`, `rnz-app-content`, `rnz-app-qa`; Microsoft `app-design` redirected to the RNZ skills.
- **Scripts**: `rnz:check` brand gate (also runs before every deploy build) and `rnz:sync` brand updater.
- Microsoft's sign-in screen and error fallback restyled to RNZ buttons.

Known upstream issues (Microsoft files, not changed): one Vitest spec in `scripts/validate-visual.spec.mjs` fails under the current Vitest ESM rules, and one ESLint rule flags `src/hooks/use-semantic-model-query.ts`. Neither affects the build or the app.
