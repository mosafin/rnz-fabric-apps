# Upstream

`templates/rnz-data-app` is built on Microsoft's Fabric Apps data app template.

| Item | Value |
|---|---|
| Source | https://github.com/microsoft/fabric-apps-analytic-templates |
| Branch | main |
| Taken | 2 October 2026 (shallow clone; commit not recorded) |
| Taken by | Template maintainer |

## What RNZ changed in Microsoft's files

| File | Change |
|---|---|
| `src/global.css` | Replaced with the RNZ theme |
| `src/data-palette-presets.json` | RNZ pillar palettes |
| `src/hooks/use-theme.ts` | Light theme only |
| `src/App.tsx` | RNZ starter screen |
| `src/ErrorFallback.tsx`, `src/components/auth-gate.component.tsx` | RNZ button styles and wording |
| `index.html` | `en-NZ`, light colour scheme, no font links, no favicon |
| `AGENTS.md` | RNZ rules block added at the top; Microsoft's text kept below it |
| `.agents/skills/app-design/SKILL.md` | Redirects to the RNZ skills |
| `README.md`, `package.json`, `rayfin-template.yml`, `rayfin/rayfin.yml` | RNZ names and versions |
| `CODE_OF_CONDUCT.md`, `SECURITY.md` | Removed (Microsoft open-source contacts, not relevant to RNZ apps) |

Everything else, including Microsoft's other skills, is unchanged.

## Checking for upstream changes

Every few months, or when Microsoft announces Fabric Apps changes:

1. Clone the upstream repo into a scratch folder and record its latest commit here.
2. Compare it with `templates/rnz-data-app`, ignoring the files in the table above.
3. Bring across upstream fixes to unchanged files; review any change to the files above by hand.
4. Note to check: Microsoft's Copilot guide (September 2026) connects models with `npx rayfin connector add --type fabric-semanticmodel`, while this template uses `npx fabric-app-data add` and `fabric.yaml`. Test both before switching.
