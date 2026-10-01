---
name: rnz-app-patterns
description: >
  Screen layouts and component choices for Ricoh NZ (RNZ) Fabric apps: overview
  dashboard, register explorer, detail drawer and request hand-off, built from the
  RNZ component kit in src/components/rnz. Use this whenever you plan or build a
  screen, page, layout, dashboard, table view, filter bar, KPI row, tabs, drawer
  or form in an RNZ app, or when asked to "lay this out", "add a page" or "make
  it cleaner", before writing the JSX.
---

# RNZ app patterns

Pick a pattern, compose it from `@/components/rnz`, then put the Microsoft query factories inside. Using the same four patterns everywhere is what makes RNZ apps feel like one product, and it saves you design decisions that would otherwise need review.

## Pick the pattern

| The person mainly wants to... | Pattern |
|---|---|
| See how something is tracking at a glance | A. Overview dashboard |
| Find, filter and check rows (a register, list or inventory) | B. Register explorer |
| Look at one item in depth without losing their place | C. Detail drawer (on top of A or B) |
| Ask for a change, upload or approval | D. Request hand-off |

Most apps are A plus B as two `NavTabs` items, with C on row click. Keep the number of top-level tabs to four or fewer.

## A. Overview dashboard

```tsx
<AppShell appName="Pipeline by pillar" pillar="cyber" nav={<NavTabs items={tabs} activeId={tab} onSelect={setTab} />}>
  <PageHeader
    title="Pipeline overview"
    description="Open opportunities by pillar and stage, from the CRM model."
    meta={`Data as at ${refreshed}`}
  />
  <FilterBar>{/* SelectField per slicer, plus a neutral "Clear filters" button last */}</FilterBar>
  <section aria-label="Key figures" className="mb-8 grid grid-cols-2 gap-grid lg:grid-cols-4">
    {/* 2 to 4 KpiCard. The most important first. Values use the model's format string. */}
  </section>
  <div className="grid grid-cols-1 gap-grid lg:grid-cols-12">
    <Card title="Value by month" className="lg:col-span-8">{/* VegaVisual */}</Card>
    <Card title="Top 10 accounts" className="lg:col-span-4">{/* ranked bar, key bar red, rest grey */}</Card>
    <Card title="Opportunities" className="lg:col-span-12">{/* DataGrid */}</Card>
  </div>
</AppShell>
```

- Two to four KPIs. More than that is a table.
- Mixed spans (8 and 4, 7 and 5) read better than equal tiles. Time series get the wide card.
- Every chart card has a plain title that says what it shows ("Value by month", not "Trend analysis").
- Primary action, if the screen has one, goes in `PageHeader actions`. Most dashboards have none, and that's fine.

## B. Register explorer

```tsx
<PageHeader title="Content register" description="Every content piece, its folder and its status." />
<FilterBar>{/* 2 to 5 SelectFields; search input last if needed */}</FilterBar>
<Card title={`${count} items`} subtitle="Select a row to see its details.">
  {/* DataGrid with the template's cross-highlighting; row click opens C */}
</Card>
```

- Filters live in the URL query string (`?pillar=…&status=…`) so links can be shared and the back button works.
- Show the result count in the card title. Put "Clear filters" last in the filter bar as a `neutral` button.
- Status columns use text plus an icon, never colour alone.

## C. Detail drawer

A right-hand panel over the current screen, `bg-background`, `rounded-2xl` on the inner edge, `shadow-28`, grey scrim at 60% on narrow screens. Title as `h2`, then sections as `Card` with no shadow. Close with a neutral button, `Esc`, and focus returns to the row that opened it. Put the drawer's selection in the URL (`&item=…`).

## D. Request hand-off

This template reads data through DAX queries and doesn't write back. When someone needs to request, upload or approve something:

- Build the request in the app (structured fields with `SelectField`, a live "what will happen" summary), then open the organisation's Power Apps form or flow with the fields prefilled in the URL. Use `LinkButton variant="primary"` labelled with the outcome, such as "Send the request".
- Don't build direct write paths, file uploads or credential handling in the app unless the person confirms the platform supports it.
- After hand-off, show a `StatusMessage tone="info"` saying what happens next and where to see progress.

## Every data component handles three states

| State | Use |
|---|---|
| Loading | `LoadingSkeleton` shaped like the content |
| Empty | `EmptyState` saying why it's empty and what to try (usually "Clear the filters") |
| Error | `ErrorState` with the real error message and a retry. Never fall back to mock data |

Call `useThemeContext()` and `useSemanticModelQuery()` at the top of the component, before any early return (Microsoft runtime rule).

## Component map

| Need | Use | Notes |
|---|---|---|
| Page frame, header, nav | `AppShell`, `NavTabs`, `SideNav` | `SideNav` only for five or more sections |
| Screen title | `PageHeader` | One per screen. No eyebrow. Metadata in `meta` |
| Grouped content | `Card` | `accent` for the one or two most important cards only |
| Single figure | `KpiCard` | Value then label. Optional plain `context` line |
| Category label | `Tag` | Outline, sentence case. `tone="red"` for "New" only |
| Actions | `Button`, `LinkButton` | One `primary` per view |
| Filters | `FilterBar`, `SelectField` | Visible label on every field |
| Switching views | `Tabs` | Arrow keys work. Accent underline follows the pillar |
| Messages | `StatusMessage` | error, success, warning, info. Always on white |

If you need something not listed (a toast, a modal, a date picker), follow `rnz-app-brand` and place it in `src/components/` outside the `rnz` folder.

## Responsive and accessible by default

- Mobile first. Check 390px and 1280px. Nothing scrolls sideways except data grids.
- Keyboard reaches everything, focus is always visible, 44px touch targets.
- One `h1` per screen, then `h2` per card, no skipped levels.
