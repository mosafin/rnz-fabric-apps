---
name: rnz-app-brand
description: >
  The Ricoh NZ (RNZ) Digital Design System for Fabric apps: colour roles, type,
  shape, spacing, charts, pillar accents, logo and imagery rules, mapped to this
  template's Tailwind tokens. Load it before writing ANY presentation code in an
  RNZ app: layouts, components, colours, fonts, chart styling, Vega-Lite configs,
  themes, icons or "make it look better" requests. It replaces the aesthetic step
  of Microsoft's app-design skill, so use it even when that skill is also loaded.
---

# RNZ app brand

Source: `ricoh-brand-methodology-v12.html` (RNZ Digital Design System), which applies the Ricoh Brand Communication Guidelines v6.0 and the RNZ Brand Colour Chart. The tokens in `src/global.css` already encode it. Your job is to use them consistently, not to reinterpret them.

## Why this replaces "pick a bold direction"

Microsoft's `app-design` skill asks for a new, distinctive aesthetic per app, characterful fonts, atmospheric backgrounds and a dark toggle. RNZ apps do the opposite on purpose: every RNZ app should feel like ricoh.co.nz so people trust it at a glance. **The direction is already decided:** white and calm, grey text, red only where action or state matters, generous space, thin accent bars. Polish comes from precise spacing, hierarchy and restraint. Ignore every "Make it yours" prompt in Microsoft's references; their mechanics (Vega-Lite config keys, Radix patterns, container sizing) still apply.

## Colour roles

Red, white and grey make up 80 to 90% of any screen. If a screen looks like a rainbow, remove colour until it doesn't.

| Role | Tailwind class | Value | Use for | Never |
|---|---|---|---|---|
| Primary | `bg-primary`, `text-primary`, `border-primary` | #CF142B | The one primary action, links, selected and active state, focus, key figures | Body text, decoration, a second competing action |
| Pressed | `bg-primary-pressed` | #A51022 | Hover and pressed on red only | Anywhere else |
| Text | `text-foreground` (also `muted-foreground`) | #666666 | ALL text and icons | Replacing with a darker or lighter grey |
| Background | `bg-background`, `bg-card` | #FFFFFF | Page, cards, panels, popovers | |
| Light surface | `bg-secondary`, `bg-muted`, `bg-surface` | #F5F5F5 | Side nav, filter bar, table header, hover, skeletons | |
| Border | `border-border` | #E0E0E0 | Dividers and card outlines | Behind text (grey on it fails AA) |
| Input border | `border-input` | #666666 | Inputs, selects, neutral buttons | |
| Error | `text-destructive`, `border-l-destructive` | #CF142B | Errors, always with icon and text | |
| Success, warning, info | `border-l-success`, `-warning`, `-info` | #7B9C6B, #FFC13D, #4F8FAC | 4px status bars and icons | Text, fills behind text |
| Pillar accent | `var(--rnz-accent)` via `<AppShell pillar>` | Pillar colour | 4px card top bar, active tab underline, one chart series | Buttons, links, hero or section fills |

**Never:** black or near-black, dark surfaces of any kind, gradients, Tailwind default palette classes, pastel fills behind body text, invented tints or shades.

**Text pairings that pass WCAG 2.2 AA:** grey on white (5.74), grey on #F5F5F5 (5.27), red on white (5.54), white on red (5.54), white on grey (5.74), white on any pillar colour. Nothing else.

## Type

Frutiger, falling back to Arial, set once in `global.css`. Never add a font link or a `font-family` in a component. Hierarchy comes from size and weight, never from a darker colour.

| Role | Classes |
|---|---|
| Screen title (h1, one per screen) | `font-page-title text-[length:var(--text-hero-700)] leading-[var(--leading-hero-700)] font-bold` (or `<PageHeader>`) |
| Section title (h2) | `text-[length:var(--text-600)] leading-[var(--leading-600)] font-bold` |
| Card or panel title | `text-[length:var(--text-500)] leading-[var(--leading-500)] font-bold` (or `<Card title>`) |
| Body, inputs | `text-400 leading-400` |
| Labels, dense tables, help | `text-300 leading-300` |
| Captions, timestamps | `text-200 leading-200` |
| KPI value | `font-numeric text-[length:var(--text-hero-800)] font-bold text-primary tabular-nums` (or `<KpiCard>`) |
| Intro line under a title | `font-light` at body size or larger, never small |

Rules: sentence case everywhere. No eyebrow or kicker labels, no ALL CAPS, no letter-spacing on small text. One or two key words in a headline may be red; never body text. Reading width 60 to 75 characters (`max-w-[72ch]`). Left-aligned. Nothing below 12px. `font-semibold` renders Bold by design.

## Shape, space, elevation

- Radius: `rounded-md` (4px) buttons, inputs, tags. `rounded-xl` (8px) cards, panels, menus. `rounded-2xl` (12px) modals and hero panels. `rounded-3xl` (16px) large feature containers. `rounded-full` only for spinners and avatars.
- Spacing on the 8px grid: `gap-2` 8, `gap-3` 12, `gap-4` 16, `p-6` 24 card padding, `gap-8` 32, `py-12` 48 between blocks. Dashboard grids use `gap-grid`.
- Content max width 1160px (`<AppShell>` handles it). Gutters 16px mobile, 32px desktop. No horizontal scroll at 320px.
- Elevation: prefer a border. `shadow-2` for cards, `shadow-8` raised panels, `shadow-28` menus, toasts and modals. All grey-tinted. Modal scrim is Ricoh Grey at 60%, never black.
- Accent bars: 4px top on a card (`<Card accent>`) or 3 to 6px left on callouts and active nav. One accent style per component; never top and left together.

## Components

Use `src/components/rnz` first: `AppShell`, `NavTabs`, `SideNav`, `PageHeader`, `Card`, `KpiCard`, `Tag`, `Button`, `LinkButton`, `FilterBar`, `SelectField`, `Tabs`, `StatusMessage`, `LoadingSkeleton`, `EmptyState`, `ErrorState`. `rnz-app-patterns` says which to use where. When you need something new, build it from tokens in the same style and keep it in the app's own folder, not in `src/components/rnz` (that folder is brand-managed).

Buttons: one red `primary` per view. `secondary` (white, red border) for alternatives. `neutral` (white, grey border) for cancel, back, low priority. `onRed` only inside red bands. Minimum 44px high. Verb-led labels.

## Charts and the DataGrid

- Let the theme supply colours: omit `scale.range` and fixed colours so Vega uses `--color-data-1` to `--color-data-10` (Microsoft `visuals` rule). Series order: Ricoh Red, Ricoh Grey, muted blue, muted teal, muted green, then blue, teal, green, amber, pink.
- Keep charts to five series where you can. Series 6 to 10 sit below 3:1 on white, so when used, label them directly or add 2px white separators.
- When one number matters most, highlight it in red and push the rest to grey (`#666666`) with a conditional colour encoding. This is the RNZ default for ranking charts.
- On a pillar app, the pillar palette preset in `src/data-palette-presets.json` puts the pillar colour first. Use the `rnz-muted` preset when red would compete with the screen's primary action.
- Axes and gridlines grey and #E0E0E0, white background, no 3D, no gradients, no area opacity tricks.
- Colour is never the only signal: direct labels, legends with text, or patterns.
- DataGrid: pass `theme` from `useThemeContext()`. Header row reads as #F5F5F5 with bold grey sentence-case text. Numbers right-aligned with tabular figures. No dark headers.

## Pillars

| `pillar` prop | Pillar | Colour |
|---|---|---|
| `workplace` | Workplace Experience | #606CBF |
| `workflow` | Workflow and Automation | #517D32 |
| `cloud` | Cloud and IT | #0F7AC9 |
| `cyber` | Cybersecurity | #00328F |
| `print` | Print and Device Management | Ricoh Red |

One pillar per app. Accents only: card top bars, active tab underline, icons, one chart series. Buttons and links stay red.

## Logo, Imagination Balloon, imagery, icons

- Logo: master file only, in `public/brand/`, passed to `<AppShell logoSrc>`. Never typed as text, drawn in SVG or CSS, recoloured, animated or placed on the balloon.
- Imagination Balloon: avoid in apps. If a flagship screen truly needs it, use the supplied master PNG only. Never as a chat bubble, button, avatar, loader or map pin, and never imitated with CSS circles.
- Imagery: real people in real NZ workplaces. No hooded hackers, holograms, globes, handshakes or AI-looking people. No text over busy images.
- Icons: Lucide, one set, consistent stroke. Grey by default, red for the active or primary icon. 16 or 20px inline, 24px UI. No emoji as icons. Icon-only buttons need `aria-label`.

## Motion

150 to 250ms, ease-out, to show cause and effect only. No auto-playing carousels, parallax or staggered page-load reveals. `prefers-reduced-motion` is honoured globally.

## Self-check before you hand back

1. Search your changes for `#000`, `#111`, `#1a1a1a`, `#333`, `black`, `dark:`, `uppercase`, `tracking-`, `gradient`, `font-family`, `fonts.googleapis`. Remove every one.
2. Exactly one red primary button per view and one `h1` per screen.
3. Every text and background pair is one of the passing pairs above.
4. Run `npm run rnz:check`. Errors block deploys.
