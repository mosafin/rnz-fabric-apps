#!/usr/bin/env node
// rnz-check: RNZ brand gate for Fabric apps (ricoh-brand-methodology-v12.html).
// Runs automatically before `npm run build:fabric`, which `npx rayfin up` uses,
// so an off-brand app can't deploy. Run by hand with `npm run rnz:check`.
//
//   npm run rnz:check            human-readable report
//   npm run rnz:check -- --json  machine-readable (for agents)
//
// Errors fail the check. Warnings don't, but agents must fix them or say why not.
// Brand-managed file: update it in the template, then run `npm run rnz:sync`.

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, relative, extname, sep } from "node:path";

const root = process.cwd();
const asJson = process.argv.includes("--json");
const findings = [];
const add = (level, rule, file, line, text, fix) =>
    findings.push({ level, rule, file: file.split(sep).join("/"), line, text: text.trim().slice(0, 140), fix });

// RNZ palette (v12.1 Sections 04 and 11). Raw hex is only allowed in the brand files.
const RNZ_HEX = new Set([
    "#cf142b", "#a51022", "#666666", "#ffffff", "#fff", "#f5f5f5", "#e0e0e0",
    "#ff9aa8", "#ffc13d", "#96c120", "#00a9c5", "#5ea8e6",
    "#dd7a87", "#bb9273", "#7b9c6b", "#428994", "#4f8fac",
    "#ffcdd3", "#ffe19e", "#cae08f", "#80d4e1", "#b0d4f4",
    "#606cbf", "#517d32", "#0f7ac9", "#00328f",
]);
const BRAND_FILES = new Set(["src/global.css", "src/data-palette-presets.json"]);
// The only logo artwork RNZ apps use: the RICOH lock-up (logo with tagline). Never rename it.
const LOCKUP_FILE = "RICOH-Logo_sRGB_full-colour.png";
const SELF = new Set(["scripts/rnz-check.mjs"]);

function walk(dir, out = []) {
    if (!existsSync(dir)) return out;
    for (const name of readdirSync(dir)) {
        if (name === "node_modules" || name === "dist" || name.startsWith(".")) continue;
        const p = join(dir, name);
        const s = statSync(p);
        if (s.isDirectory()) walk(p, out);
        else if ([".ts", ".tsx", ".css", ".json", ".html", ".mjs"].includes(extname(p))) out.push(p);
    }
    return out;
}

const files = [...walk(join(root, "src")), join(root, "index.html")].filter(existsSync);

const TW_PALETTE =
    /\b(?:bg|text|border|ring|fill|stroke|from|to|via|outline|decoration|divide|shadow|accent|caret)-(?:black|white|slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)(?:-\d{2,3})?\b/;

for (const abs of files) {
    const rel = relative(root, abs).split(sep).join("/");
    if (SELF.has(rel)) continue;
    const isBrand = BRAND_FILES.has(rel);
    const isSpec = /\.spec\.|\.test\./.test(rel);
    const isCode = /\.(tsx?|mjs)$/.test(rel);
    const lines = readFileSync(abs, "utf8").split("\n");
    let primaries = 0;

    lines.forEach((raw, i) => {
        const n = i + 1;
        const line = raw;
        const trimmed = line.trim();
        const isComment = /^(\/\/|\*|\/\*)/.test(trimmed);
        if (isComment) return;

        // 1. Black, near-black and off-palette reds/blues (v12.1 Section 04).
        if (/#(?:000(?:000)?|111(?:111)?|1a1a1a|222(?:222)?|242424|292929|333(?:333)?|414141)\b/i.test(line) || /rgba?\(\s*0\s*,\s*0\s*,\s*0\b/.test(line)) {
            add("error", "no-black", rel, n, line, "Use Ricoh Grey #666666 (text-foreground) or a light surface. Shadows use the --shadow-* tokens.");
        }
        if (/\b(?:color|background|fill|stroke)\s*:\s*['"]?black\b/i.test(line)) {
            add("error", "no-black", rel, n, line, "No black. Use the theme tokens.");
        }

        // 2. Raw hex outside the brand files.
        if (!isBrand && !isSpec) {
            const colourContext = /colou?r|fill|stroke|background|border|bg-|text-\[|shadow/i.test(line);
            for (const m of line.matchAll(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g)) {
                const hex = m[0].toLowerCase();
                if (hex.length === 4 && !colourContext) continue; // e.g. "#123" in text, not a colour
                const inQueryJson = rel.startsWith("src/queries/") && rel.endsWith(".json");
                if (inQueryJson && RNZ_HEX.has(hex)) continue; // intentional semantic colour from the palette
                add(RNZ_HEX.has(hex) ? "warning" : "error", "tokens-only", rel, n, line,
                    RNZ_HEX.has(hex)
                        ? "Brand colour, but use the token (bg-primary, text-foreground, var(--color-data-3)...) instead of raw hex."
                        : `${hex} is not an RNZ colour. Use a token from src/global.css.`);
            }
        }

        // 3. Tailwind default palette classes bypass the RNZ tokens.
        if (isCode && TW_PALETTE.test(line)) {
            add("error", "tokens-only", rel, n, line, "Use RNZ tokens: bg-primary, bg-background, bg-secondary, text-foreground, border-border, border-input.");
        }

        // 4. Fonts: Frutiger then Arial, set once in global.css. No font services.
        if (/fonts\.googleapis|fonts\.gstatic|use\.typekit|fonts\.adobe|@import\s+url\(\s*['"]?https?:/i.test(line)) {
            add("error", "no-font-links", rel, n, line, "Remove the font link. The stack in global.css is Frutiger, then Arial.");
        }
        if (!isBrand && /font-family\s*:|fontFamily\s*:/.test(line)) {
            add("error", "fonts-in-theme", rel, n, line, "Don't set fonts in components. Use font-base, font-heading or font-numeric.");
        }

        // 5. Light theme only.
        if (isCode && /(?:^|[\s"'`])dark:[\w[]/.test(line)) {
            add("error", "light-only", rel, n, line, "RNZ apps are light only. Remove dark: variants.");
        }
        if (isCode && !rel.startsWith("src/hooks/") && rel !== "src/main.tsx" && /toggleTheme/.test(line)) {
            add("error", "light-only", rel, n, line, "No theme toggle in RNZ apps.");
        }

        // 6. No all-caps labels, no letter-spaced kicker text, no eyebrows.
        if (/\buppercase\b|text-transform\s*:\s*uppercase/.test(line)) {
            add("error", "no-caps", rel, n, line, "Sentence case only. Remove uppercase.");
        }
        if (isCode && /\btracking-(?:wide|wider|widest|\[)/.test(line)) {
            add("warning", "no-eyebrows", rel, n, line, "Letter-spaced small labels read as eyebrows. Remove, or put metadata below the title.");
        }

        // 7. No gradients on brand colours.
        if (/linear-gradient|radial-gradient|conic-gradient|\bbg-gradient-|\bbg-linear-|\bbg-radial/.test(line)) {
            add("error", "no-gradients", rel, n, line, "Use flat surfaces: white, #F5F5F5 or Ricoh Red.");
        }

        // 8. Nothing below 12px.
        for (const m of line.matchAll(/text-\[(\d+(?:\.\d+)?)px\]|font-size\s*:\s*(\d+(?:\.\d+)?)px/g)) {
            const px = Number(m[1] ?? m[2]);
            if (px < 12) add("error", "min-text", rel, n, line, "Nothing smaller than 12px. Use text-200 (13px) for captions.");
        }

        // 9. Real data only.
        if (isCode && !isSpec && /\b(?:faker|mockData|sampleData|dummyData|fakeData)\b/i.test(line)) {
            add("error", "real-data-only", rel, n, line, "No mock data. Query the semantic model and show loading, empty and error states.");
        }

        // 10. House style in visible text: no em or en dashes.
        if (/\.tsx$/.test(rel) && !isSpec && /[–—]/.test(line)) {
            add("warning", "house-style", rel, n, line, "No em or en dashes in interface text. Rewrite the sentence.");
        }

        // 12a. Logo: always the lock-up, never typed, never another logo file, never a favicon.
        if (/\.(tsx|html)$/.test(rel) && !isSpec) {
            if (/>\s*RICOH\s*</.test(line)) {
                add("error", "lockup-only", rel, n, line, "Never type the logo as text. <AppShell> shows the master RICOH lock-up.");
            }
            for (const m of line.matchAll(/["'(]\/?brand\/([^"')\s]+)/g)) {
                const file = m[1];
                if (/\.(png|svg|jpe?g|webp|gif)$/i.test(file) && file !== LOCKUP_FILE && /logo|ricoh/i.test(file)) {
                    add("error", "lockup-only", rel, n, line, `Only the lock-up ${LOCKUP_FILE} may be used. The RICOH logo is never shown without the tagline.`);
                }
            }
            if (/rel=["'](?:shortcut )?icon|apple-touch-icon/i.test(line) && /\/?brand\//.test(line)) {
                add("error", "lockup-only", rel, n, line, "The lock-up can't be read at favicon size, and the logo alone is never used. Remove the logo favicon.");
            }
        }

        // 11. One primary action per view.
        if (/\.tsx$/.test(rel) && !isSpec && !rel.startsWith("src/components/rnz/")) {
            primaries += (line.match(/variant=["']primary["']/g) || []).length;
            primaries += (line.match(/<Button(?![^>]*variant=)/g) || []).length;
        }
    });

    if (primaries > 1) {
        add("warning", "one-primary", rel, 0, `${primaries} primary buttons in this file`,
            "One red primary action per view. Make the others secondary or neutral, unless they are on separate screens.");
    }
}

// 12. Logo: the master lock-up must be present, and it must be the only logo file.
const brandDir = join(root, "public", "brand");
const brandFiles = existsSync(brandDir) ? readdirSync(brandDir) : [];
if (!brandFiles.includes(LOCKUP_FILE)) {
    add("error", "lockup-only", `public/brand/${LOCKUP_FILE}`, 0, "The RICOH lock-up file is missing or was renamed",
        `Restore public/brand/${LOCKUP_FILE} with \`npm run rnz:sync -- --from <template> --apply\`. Never rename it.`);
}
for (const f of brandFiles) {
    if (f !== LOCKUP_FILE && /\.(png|svg|jpe?g|webp|gif)$/i.test(f) && /logo|ricoh/i.test(f)) {
        add("error", "lockup-only", `public/brand/${f}`, 0, "Extra logo file",
            "RNZ always uses the lock-up. Remove this file; never use the logo without the tagline.");
    }
}

// 13. Brand-managed files edited locally. Line endings are ignored, so a Windows
// checkout (CRLF) doesn't count as an edit. Keep this function identical in
// rnz-sync.mjs and the template repo's root scripts/rnz-lock.mjs.
function brandHash(path) {
    const buf = readFileSync(path);
    const binary = /\.(png|jpe?g|gif|webp|ico|woff2?|ttf|otf|pdf)$/i.test(path);
    const data = binary ? buf : Buffer.from(buf.toString("utf8").replace(/\r\n/g, "\n"), "utf8");
    return createHash("sha256").update(data).digest("hex");
}
const lockPath = join(root, "rnz", "brand-lock.json");
if (existsSync(lockPath)) {
    const lock = JSON.parse(readFileSync(lockPath, "utf8"));
    for (const [file, hash] of Object.entries(lock.files ?? {})) {
        const p = join(root, file);
        if (!existsSync(p)) {
            add("error", "brand-managed", file, 0, "Brand-managed file is missing or was renamed",
                "File names never change. Restore it with `npm run rnz:sync -- --from <template> --apply`.");
            continue;
        }
        const now = brandHash(p);
        if (now !== hash) {
            add("warning", "brand-managed", file, 0, "Brand-managed file has local edits",
                "Change it in the RNZ template instead, then sync. Local edits are replaced on the next sync.");
        }
    }
}

const errors = findings.filter((f) => f.level === "error");
const warnings = findings.filter((f) => f.level === "warning");

if (asJson) {
    console.log(JSON.stringify({ ok: errors.length === 0, errors, warnings }, null, 2));
} else {
    console.log("RNZ brand check (ricoh-brand-methodology-v12.html)");
    for (const f of [...errors, ...warnings]) {
        const where = f.line ? `${f.file}:${f.line}` : f.file;
        console.log(`\n${f.level === "error" ? "ERROR  " : "WARNING"} [${f.rule}] ${where}\n  ${f.text}\n  Fix: ${f.fix}`);
    }
    console.log(`\n${errors.length} error(s), ${warnings.length} warning(s).`);
    console.log(errors.length ? "Not ready to deploy. Fix the errors, then run it again." : "Brand check passed.");
}
process.exit(errors.length ? 1 : 0);
