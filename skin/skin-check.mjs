#!/usr/bin/env node
// RNZ skin check (rnz-fabric-apps). Copied into apps that use the RNZ skin as rnz/skin-check.mjs.
// Reports hardcoded colours, fonts and font weights that bypass the RNZ tokens, and checks the
// skin is wired in. Report only by default; add --strict to fail (exit 1) on any finding.
//   node rnz/skin-check.mjs            report
//   node rnz/skin-check.mjs --json     machine-readable
//   node rnz/skin-check.mjs --strict   exit 1 if anything is found
// No dependencies. Never edits files.

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, extname, sep, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const RNZ_PALETTE = [
  { token: "var(--rnz-red)", hex: "#CF142B", name: "Ricoh Red" },
  { token: "var(--rnz-red-pressed)", hex: "#A51022", name: "Red, pressed" },
  { token: "var(--rnz-grey)", hex: "#666666", name: "Ricoh Grey (all text)" },
  { token: "var(--rnz-white)", hex: "#FFFFFF", name: "White" },
  { token: "var(--rnz-light)", hex: "#F5F5F5", name: "Light surface" },
  { token: "var(--rnz-border)", hex: "#E0E0E0", name: "Border" },
  { token: "var(--rnz-muted-blue)", hex: "#4F8FAC", name: "Muted blue" },
  { token: "var(--rnz-muted-teal)", hex: "#428994", name: "Muted teal" },
  { token: "var(--rnz-muted-green)", hex: "#7B9C6B", name: "Muted green" },
  { token: "var(--rnz-blue)", hex: "#5EA8E6", name: "Blue" },
  { token: "var(--rnz-teal)", hex: "#00A9C5", name: "Teal" },
  { token: "var(--rnz-green)", hex: "#96C120", name: "Green" },
  { token: "var(--rnz-amber)", hex: "#FFC13D", name: "Amber" },
  { token: "var(--rnz-pink)", hex: "#FF9AA8", name: "Pink" },
];

const SKIP_DIRS = new Set(["node_modules", "dist", "build", "out", ".git", ".agents", ".github", ".cursor", ".claude",
  "backups", "backup", "coverage", ".playwright", ".playwright-cli", "rnz", "public", "test-results", ".vite"]);
const SCAN_EXT = new Set([".css", ".scss", ".tsx", ".ts", ".jsx", ".js", ".html", ".vue", ".svelte"]);
const SKIP_FILE = /(\.spec\.|\.test\.|\.d\.ts$|rnz-skin\.css$|rnz-lockup\.(t|j)sx$|fabric\.generated\.ts$)/;

export function walk(dir, root = dir, out = []) {
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name) || e.name.startsWith(".")) continue;
      walk(p, root, out);
    } else if (SCAN_EXT.has(extname(e.name)) && !SKIP_FILE.test(e.name)) {
      out.push(p);
    }
  }
  return out;
}

export function hexToRgb(hex) {
  let h = hex.replace("#", "");
  if (h.length === 3 || h.length === 4) h = h.slice(0, 3).split("").map((c) => c + c).join("");
  h = h.slice(0, 6);
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function parseRgbFunc(s) {
  const m = s.match(/rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i);
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}

/** Nearest RNZ colour. Near-black always maps to Ricoh Grey (no black in RNZ). */
export function suggestColour(rgb) {
  if (!rgb) return RNZ_PALETTE[2];
  const [r, g, b] = rgb;
  const luma = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  const sat = Math.max(r, g, b) - Math.min(r, g, b);
  if (luma < 0.35 && sat < 60) return RNZ_PALETTE[2];
  let best = RNZ_PALETTE[0], bestD = Infinity;
  for (const p of RNZ_PALETTE) {
    const [pr, pg, pb] = hexToRgb(p.hex);
    const d = (r - pr) ** 2 * 0.3 + (g - pg) ** 2 * 0.59 + (b - pb) ** 2 * 0.11;
    if (d < bestD) { bestD = d; best = p; }
  }
  return best;
}

const TW_PALETTE = /\b(?:bg|text|border|ring|fill|stroke|from|to|via|outline|decoration|divide|placeholder|accent|caret|shadow)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|black)(?:-\d{2,3})?(?:\/\d{1,3})?\b/g;
const HEX = /(?<![\w&])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![\w-])/g;
const FUNC = /\b(?:rgba?|hsla?)\(\s*[\d.]+[^)]*\)/gi;
const FONT_LINK = /fonts\.googleapis\.com|fonts\.gstatic\.com|use\.typekit\.net|fonts\.bunny\.net/i;
const FONT_FAMILY = /(font-family\s*:\s*|fontFamily\s*:\s*["'`])([^;"'`}]+)/gi;
const FONT_WEIGHT = /(font-weight\s*:\s*|fontWeight\s*:\s*["'`]?)(100|200|500|600|800|900)\b/gi;
const TW_WEIGHT = /\bfont-(?:thin|extralight|extrabold|black)\b/g;

function weightSuggestion(w) {
  const n = Number(w);
  if (n <= 200) return "300 (var(--rnz-weight-light))";
  if (n === 500) return "400 or 700 (Arial has no 500)";
  return "700 (var(--rnz-weight-bold))";
}

/**
 * Scan an app folder for values that bypass the RNZ tokens.
 * Custom property definitions (--name: value) are reported separately as "tokens", because the
 * skin overrides the common ones; only app-specific tokens need attention.
 */
export function scanLiterals(appDir) {
  const findings = [];
  const tokens = [];
  for (const file of walk(appDir)) {
    const rel = relative(appDir, file).split(sep).join("/");
    let text;
    try { text = readFileSync(file, "utf8"); } catch { continue; }
    const lines = text.split(/\r?\n/);
    const isCss = /\.(s?css)$/.test(file);
    lines.forEach((line, i) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*")) return;
      const at = `${rel}:${i + 1}`;
      if (FONT_LINK.test(line)) findings.push({ at, kind: "font-link", value: trimmed.slice(0, 120), suggestion: "Remove the font link. RNZ uses Frutiger, then Arial, with no font services." });
      // Custom property definitions (--name: value) are tokens, not literals: the skin overrides the
      // standard ones, and the rest are listed separately. Strip them before scanning the line.
      if (isCss && line.includes("--")) {
        line = line.replace(/(--[\w-]+)\s*:\s*([^;}]+);?/g, (all, name, v) => {
          if (/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?)\(/i.test(v)) tokens.push({ at, name, value: v.trim().replace(/\s*\/\*.*$/, "") });
          return "";
        });
        if (!line.trim()) return;
      }
      for (const m of line.matchAll(HEX)) {
        if (!isCss && !/["'`(:]\s*#|style|color|fill|stroke|background|border/i.test(line)) continue;
        const p = suggestColour(hexToRgb(m[0]));
        findings.push({ at, kind: "colour", value: m[0], suggestion: `${p.token} (${p.name} ${p.hex})` });
      }
      for (const m of line.matchAll(FUNC)) {
        if (/var\(/.test(m[0])) continue;
        const p = suggestColour(parseRgbFunc(m[0]));
        if (/^rgba\(\s*100\s*,\s*102\s*,\s*106/i.test(m[0])) continue; // RNZ shadow tint
        findings.push({ at, kind: "colour", value: m[0], suggestion: `${p.token} (${p.name} ${p.hex})` });
      }
      for (const m of line.matchAll(TW_PALETTE)) {
        findings.push({ at, kind: "tailwind-colour", value: m[0], suggestion: "Use a token class: bg-primary, text-foreground, bg-card, bg-muted, border-border" });
      }
      for (const m of line.matchAll(FONT_FAMILY)) {
        if (/var\(|inherit|monospace|Frutiger|Consolas/i.test(m[2])) continue;
        findings.push({ at, kind: "font", value: m[2].trim().slice(0, 60), suggestion: "var(--rnz-font) (Frutiger, then Arial)" });
      }
      for (const m of line.matchAll(FONT_WEIGHT)) {
        findings.push({ at, kind: "weight", value: m[2], suggestion: weightSuggestion(m[2]) });
      }
      for (const m of line.matchAll(TW_WEIGHT)) {
        findings.push({ at, kind: "weight", value: m[0], suggestion: "font-light, font-normal or font-bold" });
      }
    });
  }
  return { findings, tokens };
}

/** Where the skin is wired in, for the check. */
export function skinStatus(appDir) {
  const cfgPath = join(appDir, "rnz", "skin.json");
  const cfg = existsSync(cfgPath) ? JSON.parse(readFileSync(cfgPath, "utf8")) : null;
  const status = { configured: !!cfg, cssPresent: false, imported: false, lockupAsset: false, lockupUsed: false, cfg };
  if (!cfg) return status;
  const cssPath = join(appDir, cfg.css || "src/rnz-skin.css");
  status.cssPresent = existsSync(cssPath);
  if (cfg.entry && existsSync(join(appDir, cfg.entry))) {
    status.imported = /rnz-skin\.css/.test(readFileSync(join(appDir, cfg.entry), "utf8"));
  }
  if (!status.imported && existsSync(join(appDir, "index.html"))) {
    status.imported = /rnz-skin\.css/.test(readFileSync(join(appDir, "index.html"), "utf8"));
  }
  status.lockupAsset = existsSync(join(appDir, "public", "brand", "RICOH-Logo_sRGB_full-colour.png"));
  for (const f of walk(join(appDir, "src"))) {
    const t = readFileSync(f, "utf8");
    if (/RicohLockup|RICOH-Logo_sRGB_full-colour\.png/.test(t)) { status.lockupUsed = true; break; }
  }
  return status;
}

function main() {
  const args = process.argv.slice(2);
  const json = args.includes("--json");
  const strict = args.includes("--strict");
  const here = dirname(fileURLToPath(import.meta.url));
  const appDir = resolve(args.find((a) => !a.startsWith("--")) || (here.endsWith(`${sep}rnz`) ? join(here, "..") : process.cwd()));

  const status = skinStatus(appDir);
  const { findings, tokens } = scanLiterals(appDir);
  const problems = [];
  if (!status.configured) problems.push("No rnz/skin.json: the RNZ skin isn't applied to this folder.");
  else {
    if (!status.cssPresent) problems.push(`Missing ${status.cfg.css}. Run the RNZ skin again; never rename it.`);
    if (!status.imported) problems.push("rnz-skin.css isn't imported by the app entry, so the skin isn't loading.");
    if (!status.lockupAsset) problems.push("Missing public/brand/RICOH-Logo_sRGB_full-colour.png (never rename it).");
  }
  const notes = [];
  if (status.configured && !status.lockupUsed) notes.push("The RICOH lock-up isn't shown yet. Add <RicohLockup /> (src/rnz-lockup.tsx) to the app header, at least 80px wide.");

  if (json) {
    console.log(JSON.stringify({ appDir, status, problems, notes, findings, tokens }, null, 2));
  } else {
    console.log(`RNZ skin check: ${appDir}`);
    for (const p of problems) console.log(`  PROBLEM  ${p}`);
    for (const n of notes) console.log(`  NOTE     ${n}`);
    const byKind = findings.reduce((a, f) => ((a[f.kind] = (a[f.kind] || 0) + 1), a), {});
    console.log(`  Hardcoded values outside the tokens: ${findings.length} ${JSON.stringify(byKind)}`);
    for (const f of findings.slice(0, 40)) console.log(`    ${f.at}  ${f.value}  ->  ${f.suggestion}`);
    if (findings.length > 40) console.log(`    ...and ${findings.length - 40} more (use --json for all)`);
    console.log(`  App colour tokens defined in CSS: ${tokens.length} (the skin overrides the standard ones)`);
    console.log(problems.length ? "Skin check found problems." : "Skin check passed.");
  }
  if (problems.length || (strict && findings.length)) process.exit(1);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
