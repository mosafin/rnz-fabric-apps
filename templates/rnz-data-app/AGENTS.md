# Agent instructions: RNZ Fabric data app

<!-- RNZ:BEGIN -->
## RNZ rules (read first, these win)

This is a **Ricoh New Zealand Limited** Fabric app built from the RNZ Data App template, which is Microsoft's data app template plus the RNZ brand layer. Where anything below this block, in a Microsoft skill or in a general design habit conflicts with this block, **this block wins**.

**Brand authority:** `ricoh-brand-methodology-v12.html` (RNZ Digital Design System). The template already encodes it in `src/global.css` and `src/components/rnz/`. Don't restate brand values in components; use the tokens and components.

### Skills to load

| When | Load |
|---|---|
| Starting a new app, or the user says "build this RNZ app" | `.agents/skills/rnz-new-app/SKILL.md` |
| Before writing any presentation code, layout, colour, type or chart styling | `.agents/skills/rnz-app-brand/SKILL.md` (replaces Microsoft's app-design aesthetic step) |
| Choosing a screen layout or component | `.agents/skills/rnz-app-patterns/SKILL.md` |
| Writing any visible text: titles, labels, buttons, empty and error states | `.agents/skills/rnz-app-content/SKILL.md` |
| Before saying the work is done, and before `npx rayfin up` | `.agents/skills/rnz-app-qa/SKILL.md` |
| Schema discovery, DAX, visuals, validation, Rayfin CLI | Microsoft skills, as described in the rest of this file |

### Non-negotiables

1. **Light theme only.** No dark mode, no theme toggle, no `dark:` classes, no dark headers, bands or sidebars. `useAppTheme()` always returns light.
2. **No black or near-black** anywhere (#000, #111, #1A1A1A, #242424, #333). All text is Ricoh Grey through `text-foreground`.
3. **Tokens only.** Never hardcode colours, font stacks or pixel sizes in components. Raw values live only in `src/global.css` and `src/data-palette-presets.json`. Never use Tailwind's default palette classes (`bg-white`, `text-gray-700`, `bg-blue-600`...).
4. **Frutiger, falling back to Arial.** Never add Google Fonts or any font link. Never choose a "characterful" font.
5. **One red primary action per view.** Secondary is white with a red border. Neutral is white with a grey border.
6. **Sentence case.** No eyebrow or kicker labels, no ALL CAPS, no letter-spaced small labels. Metadata goes below a title.
7. **Never type, draw or rebuild the RICOH logo or the Imagination Balloon.** Use the master file in `public/brand/` via `<AppShell logoSrc>`. Never use the balloon as a chat bubble or UI shape.
8. **Pillar colours are accents only**, on that pillar's apps: set `pillar` on `<AppShell>`. Never fill buttons, heroes or sections with them.
9. **Real data only.** No mock data, no invented figures, no placeholder statistics shown as real.
10. **NZ English**, no em or en dashes in interface text, no colleague names in labels or sample text.
11. **Don't edit brand-managed files** (listed in `rnz/brand-manifest.json`). If the brand layer needs a change, say so; it is changed in the template and synced with `npm run rnz:sync`.
12. **Run `npm run rnz:check` before finishing.** It also runs automatically before every deploy build and blocks deploys on errors.

### Build order

1. Discover the semantic model and validate each query factory (Microsoft steps below).
2. Load `rnz-app-brand` and `rnz-app-patterns`, then compose screens from `src/components/rnz`.
3. Load `rnz-app-content` for every visible string.
4. Run `npm run rnz:check`, the build and the Microsoft browser validation, then `rnz-app-qa`.
<!-- RNZ:END -->

# Microsoft data app instructions

## Purpose

You will help the user build a React web app that visualizes data from Power BI semantic models. The app fetches live data via DAX queries, renders charts and grids using Vega-Lite and a built-in DataGrid component, and uses the RNZ light theme only (see the RNZ rules above). Your job is to discover the user's data, write correct DAX queries, build React components that fetch and display that data, and validate the result in the browser.

## Semantic model schema (discover it progressively)

Before the first schema command, ensure the user- or task-provided semantic model is registered and
its connection alias is known. Never register an inferred or additional data source.

Discover the connected model's schema on demand with DAX `INFO.VIEW.*` queries run through `npx fabric-app-data query`. Fetch only what the current request needs: start with a scope probe, then tables, then columns and measures for the tables that are relevant.

Do **not** fetch the whole schema upfront, and do **not** rely on `src/fabric.generated.ts` for schema because it holds only connection aliases.

Complete the initial semantic-model discovery with the supplied connection details and model
metadata before inspecting generic application source files. Do not include `global.css`,
`package.json`, `App.tsx`, hooks, utilities, or broad `src/**` patterns in initial glob, search, or
read operations. After initial discovery, inspect only the files needed to implement the request.
When modifying existing behavior, relevant query files may be inspected earlier.

The [schema-discovery](.agents/skills/schema-discovery/SKILL.md) skill has the discovery order, INFO function map, and narrowing patterns.

## API discovery

Use exact symbol searches and the narrowest relevant public declaration or template-local source file to learn an API. Do not broadly list, search, read, or dynamically import package internals, compiled JavaScript bundles, or Vite dependency bundles. Read runtime implementation only when the task explicitly requires debugging behavior.

For visualizations backed by a Fabric semantic model, follow these four steps:

```tsx
// 1. barrel   src/queries/<page>/<viz>.ts exports { connection, query, columnMetadata, vegaLiteSpec }
// 2. fetch    const { data, isLoading, error } = useSemanticModelQuery({ connection, query });
// 3. shape    const table = toDataTable(data.table, columnMetadata);
// 4. render   <VegaVisual spec={vegaLiteSpec} data={table} theme={theme} />   // or <DataGrid data={table} theme={theme} />
```

When a component uses `useThemeContext()` or `useSemanticModelQuery()`, call the hook unconditionally at the top of the component before any loading or error return.

Runtime rules:

- **DAX failures do not throw from the SDK.** `useSemanticModelQuery` maps failed query results, transport failures, and unexpected runtime failures to its `error` field. Handle `error`, then require `data.status === "success"` before touching `data.table`.
- Key `columnMetadata` by the query's exact raw output column name. Give each entry a bracket-free `name` alias for Vega-Lite and DataGrid fields; raw names containing `.`, `[`, or `]` can render as `undefined`.
- Pass the resolved `theme` from `useThemeContext()` to `VegaVisual` and `DataGrid`.

## Project structure

```
fabric.yaml                # Fabric connection config
index.html                 # Vite entry HTML
vite.config.ts             # Vite + Tailwind build config
tsconfig.json              # TypeScript configuration
src/
├── fabric.generated.ts    # Connection aliases to workspace/item IDs
├── main.tsx               # App entry point
├── App.tsx                # Main dashboard layout
├── ErrorFallback.tsx      # Error boundary fallback UI
├── global.css             # Tailwind design tokens
├── data-palette-presets.json
├── components/
├── hooks/
├── lib/
├── queries/               # DAX, Vega-Lite specs, and factory functions
└── vite-env.d.ts
```

## Query and spec organization

Group query files by page or domain under `src/queries/`. Each visualization uses the same kebab-case base name for its `.dax`, `.json`, and `.ts` files.

- Keep all DAX in `.dax` files and import it with Vite's `?raw` suffix.
- Use separate `.dax` files when a parameter changes query structure.
- Export a factory returning `{ connection, query, columnMetadata, vegaLiteSpec }`.
- Key `columnMetadata` by exact query output names and map each to a Vega-safe `name`, user-facing `displayName`, and optional `format`.
- Re-export modules through an `index.ts` in each group and at the `src/queries/` root.
- Never define Vega-Lite specs inline in component files.

Validate each single-table visual immediately after completing its query factory and before UX design, editing `src/global.css`, or writing component code. Run `npm run validate:visual -- <query-factory.ts> [factory-params-json] [<query-factory.ts> [factory-params-json] ...]`, repeating a factory path for every relevant parameter variant. Run the validation command directly without piping it through `tail`, `grep`, `head`, or another command that can hide a nonzero exit status. Validate all completed factories in one command when possible, and do not proceed until every result passes.

After the required schema and query results are understood, load and follow the [app-design](.agents/skills/app-design/SKILL.md) skill before writing presentation code.

## Validation

Browser validation is required after UI changes. After implementation is complete, load and follow the [app-validation](.agents/skills/app-validation/SKILL.md) skill, validate through the Fabric portal embed flow, and fix issues before considering the task complete. Use only the target Fabric workspace URI supplied by the user or task. If deployment configuration is missing and no target workspace URI was supplied, ask the user for one.

## Critical rules

1. **Never use mock, fake, or hardcoded data.** All data must come from a real source.
2. **Never store data in memory or local storage.** Fetch on demand from the real source.
3. **Do not assume or silently add a data source.** Confirm the source with the user and never supplement it without explicit consent.
4. **Never guess query result schema.** Run the query first and use its exact output names.
5. **Do not ask the user to describe the schema.** Discover it with DAX `INFO.VIEW.*` queries.
