#!/usr/bin/env node
// RNZ tool (rnz-fabric-apps). One entry point for the team:
//   node bin/rnz.mjs install                 add /rnz-new, /rnz-skin, /rnz-update, /rnz-check to Copilot Chat
//   node bin/rnz.mjs new NAME [--workspace-id ID] [--agents builder,qa,reporter|none] [--parent DIR] [--no-open]
//   node bin/rnz.mjs skin [FOLDER] [--apply] [--light-only|--keep-dark] [--no-verify] [--force]
//   node bin/rnz.mjs update [FOLDER] [--apply] [--no-verify] [--force]
//   node bin/rnz.mjs check [FOLDER]
// No dependencies. Needs Node 20+ and git. Never renames or deletes the app's own files, never
// pushes, merges or deploys.

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync, statSync, rmSync } from "node:fs";
import { join, resolve, dirname, relative, sep, basename } from "node:path";
import { homedir, tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { scanLiterals, walk } from "../skin/skin-check.mjs";
import { parseAgents, addAgents } from "../agents/add-agents.mjs";

const TOOL_VERSION = "1.2.0";
const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TEMPLATE = join(REPO, "templates", "rnz-data-app");
const SKIN = join(REPO, "skin");
const IS_WIN = process.platform === "win32";
const BEGIN = "<!-- RNZ-SKIN:BEGIN -->";
const END = "<!-- RNZ-SKIN:END -->";

// ---------------------------------------------------------------- helpers

const posix = (p) => p.split(sep).join("/");
const read = (p) => readFileSync(p, "utf8");
const say = (s = "") => console.log(s);
function fail(msg, code = 1) { console.error(`\n${msg}`); process.exit(code); }

function quote(a) { return /[\s"&|<>^()]/.test(a) ? `"${a.replace(/"/g, '\\"')}"` : a; }

/** Run a command. npm, npx and code need a shell on Windows; arguments are quoted for spaces. */
function run(cmd, args, { cwd, timeout = 30 * 60 * 1000, capture = true, input } = {}) {
  const needsShell = IS_WIN && ["npm", "npx", "code"].includes(cmd);
  const res = needsShell
    ? spawnSync([cmd, ...args.map(quote)].join(" "), { cwd, shell: true, encoding: "utf8", timeout, stdio: capture ? "pipe" : "inherit", input })
    : spawnSync(cmd, args, { cwd, encoding: "utf8", timeout, stdio: capture ? "pipe" : "inherit", input });
  const out = `${res.stdout || ""}${res.stderr || ""}`;
  return { code: res.status ?? (res.error ? 1 : 0), out, error: res.error };
}
const git = (cwd, ...args) => run("git", args, { cwd });
const tail = (s, n = 15) => s.trim().split(/\r?\n/).slice(-n).join("\n");

function parseArgs(argv) {
  const flags = {}; const pos = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const k = a.slice(2);
      if (["workspace-id", "parent", "agents"].includes(k)) flags[k] = argv[++i];
      else flags[k] = true;
    } else pos.push(a);
  }
  return { flags, pos };
}

function readJson(p) { return JSON.parse(read(p)); }
function writeJsonLike(p, obj, original) {
  const indent = (original.match(/\n([ \t]+)"/) || [, "  "])[1];
  const eol = original.includes("\r\n") ? "\r\n" : "\n";
  writeFileSync(p, JSON.stringify(obj, null, indent).replace(/\n/g, eol) + (original.endsWith("\n") ? eol : ""));
}

function templateVersion() {
  try { return readJson(join(TEMPLATE, "rnz", "brand-manifest.json")).templateVersion; } catch { return "unknown"; }
}

/** Team copies live in ~/.rnz/rnz-fabric-apps; keep them current. Maintainer clones are left alone. */
function selfUpdate() {
  const cache = resolve(homedir(), ".rnz");
  if (!REPO.toLowerCase().startsWith(cache.toLowerCase()) || process.env.RNZ_NO_PULL) return;
  const r = git(REPO, "pull", "--ff-only", "-q");
  if (r.code !== 0) say(`Note: couldn't get the latest RNZ tool (${tail(r.out, 2)}). Carrying on with the copy you have.`);
}

// ---------------------------------------------------------------- app discovery

const APP_SKIP = new Set(["node_modules", "dist", "build", ".git", "backups", "backup", "coverage", ".agents", ".github"]);

function looksLikeWebApp(dir) {
  try {
    const pkg = readJson(join(dir, "package.json"));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    return !!(deps.react || deps.vite || deps.vue || deps.svelte || deps["@microsoft/fabric-app-data"] || deps.next);
  } catch { return false; }
}

function findApps(dir, depth = 0, out = []) {
  if (existsSync(join(dir, "package.json")) && looksLikeWebApp(dir)) { out.push(dir); return out; }
  if (depth >= 3) return out;
  let entries = [];
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    if (!e.isDirectory() || APP_SKIP.has(e.name) || e.name.startsWith(".")) continue;
    findApps(join(dir, e.name), depth + 1, out);
  }
  return out;
}

function resolveApp(arg) {
  const dir = resolve(arg || process.cwd());
  if (!existsSync(dir)) fail(`Folder not found: ${dir}`);
  if (dir.toLowerCase().startsWith(REPO.toLowerCase())) fail("That folder is inside the RNZ template repo itself. Point at an app folder instead.");
  const apps = findApps(dir);
  if (apps.length === 0) fail(`No web app found in ${dir} (no package.json with React, Vite or Fabric app packages).`);
  if (apps.length > 1) {
    say(`More than one app found in ${dir}:`);
    for (const a of apps) say(`  ${a}`);
    fail("Run the command again with the app's folder.", 2);
  }
  return apps[0];
}

const isTemplateApp = (app) => existsSync(join(app, "rnz", "brand-manifest.json"));
const isSkinnedApp = (app) => existsSync(join(app, "rnz", "skin.json"));

// ---------------------------------------------------------------- analysis

function cssVarsIn(text) {
  const vars = new Map();
  const clean = text.replace(/\/\*[\s\S]*?\*\//g, "");
  for (const m of clean.matchAll(/(--[\w-]+)\s*:\s*([^;}{]+);/g)) if (!vars.has(m[1])) vars.set(m[1], m[2].trim());
  return vars;
}

function rnzTokens() {
  const css = read(join(TEMPLATE, "src", "global.css")).replace(/\/\*[\s\S]*?\*\//g, "");
  const tokens = new Map();
  for (const block of css.matchAll(/@theme(?:\s+static)?\s*\{([\s\S]*?)\n\}/g)) {
    for (const m of block[1].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) tokens.set(m[1], m[2].trim());
  }
  const resolveVal = (v, seen = 0) => v.replace(/var\((--[\w-]+)\)/g, (all, n) => (tokens.has(n) && seen < 5 ? resolveVal(tokens.get(n), seen + 1) : all));
  for (const [k, v] of tokens) tokens.set(k, resolveVal(v));
  return tokens;
}

function findEntry(app) {
  const html = join(app, "index.html");
  if (existsSync(html)) {
    const m = read(html).match(/<script[^>]+type=["']module["'][^>]+src=["']\/?([^"']+)["']/i) || read(html).match(/<script[^>]+src=["']\/?([^"']+)["'][^>]+type=["']module["']/i);
    if (m && existsSync(join(app, m[1]))) return m[1];
  }
  for (const c of ["src/main.tsx", "src/main.ts", "src/main.jsx", "src/main.js", "src/index.tsx", "src/index.jsx", "src/index.js"]) {
    if (existsSync(join(app, c))) return c;
  }
  return null;
}

function gitInfo(dir) {
  const top = git(dir, "rev-parse", "--show-toplevel");
  if (top.code !== 0) return { isRepo: false };
  const root = resolve(top.out.trim());
  const status = git(root, "status", "--porcelain");
  const branch = git(root, "rev-parse", "--abbrev-ref", "HEAD").out.trim();
  return { isRepo: true, root, clean: status.out.trim() === "", dirty: status.out.trim(), branch };
}

function analyse(app) {
  const pkg = readJson(join(app, "package.json"));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  const appVars = new Map();
  const cssFiles = walk(app).filter((f) => /\.s?css$/.test(f) && !/rnz-skin\.css$/.test(f));
  for (const f of cssFiles) for (const [k, v] of cssVarsIn(read(f))) if (!appVars.has(k)) appVars.set(k, v);
  const srcText = walk(app).filter((f) => /\.(t|j)sx?$/.test(f)).map((f) => read(f)).join("\n");
  const cssText = cssFiles.map((f) => read(f)).join("\n");
  return {
    app, pkg, deps, appVars, cssFiles,
    entry: findEntry(app),
    react: !!deps.react,
    ts: existsSync(join(app, "tsconfig.json")),
    datagrid: !!deps["@microsoft/fabric-datagrid"],
    darkDefined: /\.dark\b|\[data-theme=["']?dark/.test(cssText),
    darkClasses: (srcText.match(/\bdark:[\w-]/g) || []).length,
    scan: scanLiterals(app),
    git: gitInfo(app),
  };
}

// ---------------------------------------------------------------- skin CSS

const SHADCN = ["background", "foreground", "card", "card-foreground", "popover", "popover-foreground", "primary",
  "primary-foreground", "secondary", "secondary-foreground", "muted", "muted-foreground", "accent", "accent-foreground",
  "destructive", "destructive-foreground", "border", "input", "ring"];

function hexToHslTriplet(hex) {
  const h = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  let hue = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    hue = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    hue *= 60;
  }
  return `${Math.round(hue)} ${Math.round(s * 1000) / 10}% ${Math.round(l * 1000) / 10}%`;
}

const RNZ_VARS = `  /* RNZ palette and type: use these when the app has no token for something. */
  --rnz-red: #CF142B;
  --rnz-red-pressed: #A51022;
  --rnz-grey: #666666;
  --rnz-white: #FFFFFF;
  --rnz-light: #F5F5F5;
  --rnz-border: #E0E0E0;
  --rnz-muted-blue: #4F8FAC;
  --rnz-muted-teal: #428994;
  --rnz-muted-green: #7B9C6B;
  --rnz-blue: #5EA8E6;
  --rnz-teal: #00A9C5;
  --rnz-green: #96C120;
  --rnz-amber: #FFC13D;
  --rnz-pink: #FF9AA8;
  --rnz-font: 'Frutiger', 'Frutiger LT Std', Arial, sans-serif;
  --rnz-weight-light: 300;
  --rnz-weight-regular: 400;
  --rnz-weight-bold: 700;`;

const DATAGRID_CSS = (() => {
  let s = `
/* Fabric DataGrid header (brand guide v12, Section 10): #F5F5F5, bold grey, 2px red rule.
   Numeric column headers line up right, like their numbers. */
.data-grid-root { --dg-header-font-weight: 700; }
.data-grid-root thead th { border-bottom: 2px solid var(--rnz-red, #CF142B); }
`;
  for (let i = 1; i <= 30; i++) {
    s += `.data-grid-root:has(tbody tr:first-child > td:nth-child(${i})[data-numeric-styling]) thead tr > th:nth-child(${i}) { text-align: right; }\n`;
  }
  return s;
})();

function buildSkinCss(a, lightOnly) {
  const rnz = rnzTokens();
  const lines = [];
  const mapped = [];
  for (const [name, appVal] of a.appVars) {
    if ((name.startsWith("--color-") || name.startsWith("--font-")) && rnz.has(name)) {
      lines.push(`  ${name}: ${rnz.get(name)};`);
      mapped.push(name);
    }
  }
  for (const n of SHADCN) {
    const name = `--${n}`;
    if (!a.appVars.has(name)) continue;
    const rnzVal = rnz.get(`--color-${n}`);
    if (!rnzVal) continue;
    const appVal = a.appVars.get(name);
    const triplet = /^\d+(\.\d+)?\s+\d+(\.\d+)?%\s+\d+(\.\d+)?%$/.test(appVal);
    lines.push(`  ${name}: ${triplet ? hexToHslTriplet(rnzVal) : rnzVal};`);
    mapped.push(name);
  }
  const chart = ["--chart-1", "--chart-2", "--chart-3", "--chart-4", "--chart-5"];
  chart.forEach((name, i) => {
    if (!a.appVars.has(name)) return;
    const hex = rnz.get(`--color-data-${i + 1}`);
    const triplet = /^\d+(\.\d+)?\s+\d+(\.\d+)?%\s+\d+(\.\d+)?%$/.test(a.appVars.get(name));
    lines.push(`  ${name}: ${triplet ? hexToHslTriplet(hex) : hex};`);
    mapped.push(name);
  });

  const font = "'Frutiger', 'Frutiger LT Std', Arial, sans-serif";
  const always = [
    ["--font-sans", font], ["--default-font-family", font],
    ["--font-weight-thin", "300"], ["--font-weight-extralight", "300"], ["--font-weight-light", "300"],
    ["--font-weight-normal", "400"], ["--font-weight-regular", "400"], ["--font-weight-medium", "500"],
    ["--font-weight-semibold", "700"], ["--font-weight-bold", "700"], ["--font-weight-extrabold", "700"],
    ["--font-weight-black", "700"],
  ].filter(([n]) => !mapped.includes(n));

  const selector = lightOnly
    ? ":root:root,\n:root:root.dark,\n:root:root .dark,\n:root:root[data-theme=\"dark\"],\n:root:root [data-theme=\"dark\"]"
    : ":root:root:not(.dark):not([data-theme=\"dark\"])";

  const css = `/* =====================================================================
   RNZ SKIN (rnz-fabric-apps ${TOOL_VERSION}, template ${templateVersion()})
   Generated by the RNZ skin tool. Never edit or rename this file: run the
   RNZ skin again (/rnz-update) to regenerate it.

   What it does: maps this app's own colour, font and font-weight tokens to
   the Ricoh New Zealand Digital Design System (brand guide v12). It changes
   values only, never layout. Unlayered and doubled :root selectors so it
   wins over the app's theme without touching the app's files.
   ${lightOnly ? "Light theme only (RNZ rule): dark mode tokens use the light values." : "Dark mode is left as the app has it; only the light theme is mapped."}
   ===================================================================== */

${selector} {
${lightOnly ? "  color-scheme: light;\n" : ""}${RNZ_VARS}

  /* This app's tokens, mapped to RNZ values (${mapped.length}). */
${lines.join("\n") || "  /* none found: the app doesn't use standard token names */"}

  /* Fonts and weights: Frutiger then Arial; 300, 400, (500), 700. */
${always.map(([n, v]) => `  ${n}: ${v};`).join("\n")}
}

/* Page font. Doubled element selector so it wins over a theme-layer body rule. */
html body {
  font-family: var(--rnz-font);
}
${a.datagrid ? DATAGRID_CSS : ""}`;
  return { css, mapped };
}

// ---------------------------------------------------------------- file helpers (tracked for undo)

class Changes {
  constructor(backupDir = null) { this.created = []; this.modified = []; this.noCommit = []; this.backupDir = backupDir; this.app = null; }
  backup(p) {
    if (!this.backupDir || !existsSync(p)) return;
    const dest = join(this.backupDir, relative(this.app, p));
    if (existsSync(dest)) return;
    mkdirSync(dirname(dest), { recursive: true });
    copyFileSync(p, dest);
  }
  write(p, content) {
    const existed = existsSync(p);
    if (existed && read(p) === content) return false;
    this.backup(p);
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, content);
    (existed ? this.modified : this.created).push(p);
    return true;
  }
  copy(src, dest) {
    if (existsSync(dest) && readFileSync(src).equals(readFileSync(dest))) return false;
    const existed = existsSync(dest);
    this.backup(dest);
    mkdirSync(dirname(dest), { recursive: true });
    copyFileSync(src, dest);
    (existed ? this.modified : this.created).push(dest);
    return true;
  }
  all() { return [...this.created, ...this.modified].filter((p) => !this.noCommit.includes(p)); }
}

function upsertBlock(text, block, where) {
  const re = new RegExp(`${BEGIN}[\\s\\S]*?${END}\\r?\\n?`);
  const eol = text.includes("\r\n") ? "\r\n" : "\n";
  const wrapped = `${BEGIN}${eol}${block.trim().replace(/\r?\n/g, eol)}${eol}${END}${eol}`;
  if (re.test(text)) return text.replace(re, wrapped);
  if (!text.trim()) return wrapped;
  return where === "top" ? `${wrapped}${eol}${text}` : `${text.replace(/\s*$/, "")}${eol}${eol}${wrapped}`;
}

function addCssImport(entryText, importPath) {
  if (/rnz-skin\.css/.test(entryText)) return entryText;
  const eol = entryText.includes("\r\n") ? "\r\n" : "\n";
  const line = `import "${importPath}"; // RNZ skin: keep this the last stylesheet import`;
  const lines = entryText.split(/\r?\n/);
  let last = -1;
  lines.forEach((l, i) => { if (/^\s*import\s+["'][^"']+\.(s?css)["']\s*;?\s*$/.test(l)) last = i; });
  if (last === -1) {
    let i = 0;
    while (i < lines.length && (/^\s*(\/\/|\/\*|\*)/.test(lines[i]) || lines[i].trim() === "")) i++;
    lines.splice(i, 0, line);
  } else lines.splice(last + 1, 0, line);
  return lines.join(eol);
}

function skinnedAppsUnder(root) {
  return findApps(root).filter(isSkinnedApp).map((a) => posix(relative(root, a)) || ".");
}

// ---------------------------------------------------------------- verification

function prepareModules(app) {
  if (existsSync(join(app, "node_modules"))) return { ok: true };
  if (!existsSync(join(app, "package-lock.json"))) return { ok: false, why: "no node_modules and no package-lock.json, so the app can't be installed safely" };
  say("  Installing the app's packages (npm ci) so its build and tests can run...");
  const r = run("npm", ["ci", "--no-audit", "--no-fund"], { cwd: app });
  return r.code === 0 ? { ok: true, installed: true } : { ok: false, why: `npm ci failed:\n${tail(r.out, 8)}` };
}

function runChecks(app, label) {
  const pkg = readJson(join(app, "package.json"));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  const scripts = pkg.scripts || {};
  const res = { build: { ran: false }, tests: { ran: false } };
  if (scripts.build) {
    say(`  ${label}: building (npm run build)...`);
    const r = run("npm", ["run", "build"], { cwd: app });
    res.build = { ran: true, ok: r.code === 0, tail: tail(r.out) };
  }
  if (deps.vitest) {
    say(`  ${label}: running tests (vitest)...`);
    const out = join(tmpdir(), `rnz-vitest-${process.pid}-${label}.json`);
    const r = run("npx", ["vitest", "run", "--reporter=json", `--outputFile=${out}`], { cwd: app });
    let failed = null;
    try {
      const j = readJson(out);
      failed = new Set();
      for (const f of j.testResults || []) for (const t of f.assertionResults || []) {
        if (t.status === "failed") failed.add(`${posix(relative(app, f.name))} > ${t.fullName || t.title}`);
      }
      if ((j.testResults || []).some((f) => f.status === "failed" && !(f.assertionResults || []).length)) failed.add(`(suite failed to load) ${j.testResults.filter((f) => f.status === "failed" && !(f.assertionResults || []).length).map((f) => posix(relative(app, f.name))).join(", ")}`);
      rmSync(out, { force: true });
    } catch { /* no JSON: fall back to exit code */ }
    res.tests = { ran: true, ok: r.code === 0, failed, tail: tail(r.out) };
  } else if (scripts.test && !/no test specified/.test(scripts.test)) {
    say(`  ${label}: running tests (npm test)...`);
    const r = run("npm", ["test"], { cwd: app });
    res.tests = { ran: true, ok: r.code === 0, failed: null, tail: tail(r.out) };
  }
  return res;
}

function regressions(before, after) {
  const out = [];
  if (before.build.ran && before.build.ok && !after.build.ok) out.push(`The build passed before and fails now:\n${after.build.tail}`);
  if (before.tests.ran && after.tests.ran) {
    if (before.tests.failed && after.tests.failed) {
      const added = [...after.tests.failed].filter((t) => !before.tests.failed.has(t));
      if (added.length) out.push(`New test failures:\n  ${added.join("\n  ")}`);
    } else if (before.tests.ok && !after.tests.ok) out.push(`The tests passed before and fail now:\n${after.tests.tail}`);
  }
  return out;
}

function describe(res) {
  const b = res.build.ran ? (res.build.ok ? "build passes" : "build fails") : "no build script";
  const t = !res.tests.ran ? "no tests" : res.tests.failed ? `${res.tests.failed.size} failing test(s)` : res.tests.ok ? "tests pass" : "tests fail";
  return `${b}, ${t}`;
}

/** Restore tracked files a build changed (generated files), so only our changes remain. */
function restoreBuildNoise(root, ours) {
  const st = git(root, "status", "--porcelain").out.split(/\r?\n/).filter(Boolean);
  const oursRel = new Set(ours.map((p) => posix(relative(root, p))));
  const noise = st.filter((l) => l.startsWith(" M")).map((l) => l.slice(3).replace(/^"|"$/g, "")).filter((p) => !oursRel.has(p));
  if (noise.length) git(root, "checkout", "--", ...noise);
}

/**
 * Safety wrapper: clean tree, new branch, checks before and after, undo on regression, commit.
 * `apply(changes)` makes the edits. Returns true if kept.
 */
function safely(app, a, { label, branchBase, message, flags }, apply) {
  const g = a.git;
  const verify = !flags["no-verify"];
  if (!g.isRepo && !flags.force) fail("This app isn't in a git repository, so changes couldn't be undone. Run `git init` and commit first, or add --force (not recommended).");
  if (g.isRepo && !g.clean && !flags.force) fail(`The repository has uncommitted changes. Commit or stash them first, so this can be undone cleanly:\n${g.dirty.split(/\r?\n/).slice(0, 12).join("\n")}`);

  let branch = null;
  if (g.isRepo && g.clean) {
    branch = branchBase;
    let n = 2;
    while (git(g.root, "rev-parse", "--verify", "--quiet", branch).code === 0) branch = `${branchBase}-${n++}`;
    const r = git(g.root, "checkout", "-b", branch);
    if (r.code !== 0) fail(`Couldn't create branch ${branch}:\n${r.out}`);
    say(`  Working on a new branch: ${branch} (your ${g.branch} branch is untouched).`);
  }

  let before = null;
  if (verify) {
    const prep = prepareModules(app);
    if (!prep.ok) { say(`  Can't run the build and tests (${prep.why}). Skipping the before and after check.`); }
    else {
      before = runChecks(app, "before");
      if (g.isRepo) restoreBuildNoise(g.root, []);
      say(`  Before: ${describe(before)}.`);
    }
  }

  const changes = new Changes(branch ? null : join(app, "rnz", `backup-${new Date().toISOString().replace(/[:.]/g, "-")}`));
  changes.app = app;
  if (!branch) say(`  No branch (not a clean git repository): anything replaced is backed up in ${posix(relative(app, changes.backupDir))}.`);
  try { apply(changes); }
  catch (e) { undo(g, branch, changes); fail(`Stopped: ${e.message}. Nothing was changed.`); }

  if (changes.all().length === 0) {
    undo(g, branch, changes);
    say("  Already up to date: nothing to change.");
    return { changes, branch: null, unchanged: true };
  }

  if (before) {
    const after = runChecks(app, "after");
    if (g.isRepo) restoreBuildNoise(g.root, changes.all());
    say(`  After:  ${describe(after)}.`);
    const reg = regressions(before, after);
    if (reg.length) {
      undo(g, branch, changes);
      say(`\n${label} was undone, because something that worked before stopped working:`);
      for (const r of reg) say(`  ${r}`);
      say("\nNothing was changed. Send this output to the template maintainer.");
      process.exit(3);
    }
  }

  if (branch) {
    const add = git(g.root, "add", "--", ...changes.all().map((p) => relative(g.root, p)));
    const commit = add.code === 0 ? git(g.root, "commit", "-m", message) : add;
    if (commit.code !== 0) say(`  Couldn't commit automatically (${tail(commit.out, 3)}). The changes are on branch ${branch}; commit them yourself.`);
    else say(`  Committed on ${branch}: "${message}".`);
  }
  return { changes, branch };
}

function undo(g, branch, changes) {
  if (g.isRepo && branch) {
    git(g.root, "checkout", "--", ...changes.modified.map((p) => relative(g.root, p)));
    git(g.root, "reset", "-q", "--hard");
  }
  for (const p of changes.created) {
    rmSync(p, { force: true });
    // Remove folders this run created and left empty (rnz/, .agents/skills/rnz-skin/ ...).
    let d = dirname(p);
    const stop = g.isRepo ? g.root : changes.app;
    while (stop && d.length > stop.length) {
      try { if (readdirSync(d).length) break; rmSync(d, { recursive: true }); } catch { break; }
      d = dirname(d);
    }
  }
  if (g.isRepo && branch) {
    git(g.root, "checkout", "-q", g.branch);
    git(g.root, "branch", "-D", branch);
  }
}

// ---------------------------------------------------------------- commands

function cmdInstall() {
  const appData = IS_WIN ? process.env.APPDATA : process.platform === "darwin" ? join(homedir(), "Library", "Application Support") : join(homedir(), ".config");
  const editors = ["Code", "Code - Insiders"].map((e) => join(appData || "", e, "User")).filter((d) => existsSync(d));
  if (process.env.RNZ_PROMPTS_DIR) editors.splice(0, editors.length, process.env.RNZ_PROMPTS_DIR);
  if (!editors.length) fail("VS Code's user settings folder wasn't found. Open VS Code once, then run this again.");
  const targets = [];
  for (const user of editors) {
    targets.push(join(user, "prompts"));
    const profiles = join(user, "profiles");
    if (existsSync(profiles)) for (const p of readdirSync(profiles)) if (statSync(join(profiles, p)).isDirectory()) targets.push(join(profiles, p, "prompts"));
  }
  const src = join(REPO, "vscode", "prompts");
  const home = posix(REPO);
  for (const t of targets) {
    mkdirSync(t, { recursive: true });
    for (const f of readdirSync(src)) writeFileSync(join(t, f), read(join(src, f)).replaceAll("{{RNZ_HOME}}", home));
  }
  say(`RNZ commands added to Copilot Chat (${readdirSync(src).length} prompts) in:`);
  for (const t of targets) say(`  ${t}`);
  say(`
In VS Code, open Copilot Chat in Agent mode and type:
  /rnz-new      create a new branded Fabric app
  /rnz-skin     apply the RNZ skin (colours, fonts, weights) to the open app
  /rnz-update   bring the open app up to the latest RNZ release
  /rnz-check    check the open app against the brand (changes nothing)
If they don't show, reload VS Code (Developer: Reload Window).`);
}

function cmdNew(pos, flags) {
  const name = pos[0];
  if (!name || !/^[a-z0-9][a-z0-9-]*$/.test(name)) fail("Give the app a name in lowercase letters, numbers and hyphens, for example: node bin/rnz.mjs new pipeline-by-pillar");
  const parent = resolve(flags.parent || (IS_WIN ? "C:\\dev" : join(homedir(), "dev")));
  mkdirSync(parent, { recursive: true });
  const target = join(parent, name);
  if (existsSync(target)) fail(`${target} already exists. Pick another name or delete that folder first.`);
  if (/onedrive/i.test(parent)) say("Note: apps inside OneDrive can hit file locks while building. C:\\dev is safer.");
  let agents;
  try { agents = parseAgents(flags.agents) ?? []; } catch (e) { fail(e.message); }
  for (const c of ["node", "npm", "git"]) if (run(c, ["--version"]).code !== 0) fail(`${c} wasn't found. Install it, then try again.`);

  say(`Creating ${name} in ${parent} from the RNZ Data App template (${templateVersion()})...`);
  const args = ["create", "@microsoft/rayfin@latest", "--", name, "--template", REPO, "--template-name", "RNZ Data App"];
  if (flags["workspace-id"]) args.push("--workspace-id", flags["workspace-id"]);
  const r = run("npm", args, { cwd: parent, capture: false });
  if (r.code !== 0 || !existsSync(target)) fail("Creating the app failed. Read the messages above.");

  say("Checking the brand...");
  const chk = run("npm", ["run", "rnz:check"], { cwd: target });
  say(tail(chk.out, 3));
  const added = addAgents(target, agents, { appName: name, templateVersion: templateVersion() });
  if (agents.length) say(`Agents added: ${agents.map((a) => `rnz-${a}`).join(", ")} (in .claude/agents).${agents.includes("reporter") ? " Version set to 0.1.0, with CHANGELOG.md." : ""}`);
  if (git(target, "rev-parse", "--is-inside-work-tree").code !== 0) {
    git(target, "init", "-q");
    git(target, "add", "-A");
    const c = git(target, "commit", "-q", "-m", `Create ${name} from the RNZ Data App template ${templateVersion()}`);
    say(c.code === 0 ? "First commit made." : `Couldn't make the first commit (${tail(c.out, 2)}).`);
  } else if (added.length) {
    git(target, "add", "--", ...added);
    const c = git(target, "commit", "-q", "-m", `Add RNZ agents: ${agents.join(", ")}`, "--", ...added);
    say(c.code === 0 ? "Agents committed." : `Couldn't commit the agents (${tail(c.out, 2)}).`);
  }
  if (!flags["no-open"] && run("code", ["--version"]).code === 0) run("code", ["-n", target]);
  const pick = agents.includes("builder") ? ", pick the rnz-builder agent" : "";
  say(`
Done: ${target}
Next, in that VS Code window, open Copilot Chat (Agent mode)${pick} and type:
  Build this RNZ app. It's for [who] to see [what]. Model: [semantic model share link]. Pillar: [pillar or none].${agents.length ? `
Agents: in Copilot Chat, choose them from the agent list (where Agent mode is picked). In Claude Code, ask for them by name, for example "use rnz-qa".` : ""}
To put it on GitHub: Source Control > Publish Branch (choose private).`);
}

function printAnalysis(a, lightOnly) {
  const rel = (p) => posix(relative(a.app, p));
  say(`App: ${a.app}`);
  say(`  Type: ${a.react ? "React" : "web"} app${a.deps["@microsoft/fabric-app-data"] ? " (Microsoft Fabric data app)" : ""}${a.ts ? ", TypeScript" : ""}`);
  say(`  Entry: ${a.entry || "not found (the skin would be linked from index.html)"}`);
  say(`  Git: ${a.git.isRepo ? `${a.git.root}, branch ${a.git.branch}, ${a.git.clean ? "clean" : "HAS UNCOMMITTED CHANGES"}` : "not a git repository"}`);
  const { css, mapped } = buildSkinCss(a, lightOnly);
  say(`  Tokens the skin would map to RNZ values: ${mapped.length}${mapped.length ? ` (${mapped.slice(0, 8).join(", ")}${mapped.length > 8 ? ", ..." : ""})` : ""}`);
  say(`  Dark mode: ${a.darkDefined ? `defined, ${a.darkClasses} dark: class(es) in components` : "not used"}. ${lightOnly ? "The skin keeps the app light (RNZ rule)." : "Left as it is (use --light-only to force light)."}`);
  if (a.datagrid) say("  Fabric DataGrid: header gets the RNZ red rule and right-aligned number headings.");
  const kinds = a.scan.findings.reduce((acc, f) => ((acc[f.kind] = (acc[f.kind] || 0) + 1), acc), {});
  say(`  Hardcoded values the skin can't reach (listed for the Copilot pass): ${a.scan.findings.length} ${JSON.stringify(kinds)}`);
  const files = [...new Set(a.scan.findings.map((f) => f.at.split(":")[0]))];
  if (files.length) say(`    in ${files.slice(0, 6).join(", ")}${files.length > 6 ? ` and ${files.length - 6} more` : ""}`);
  say(`
Would add (new files, managed by the RNZ tool):
  ${a.entry ? posix(join(dirname(a.entry), "rnz-skin.css")) : "src/rnz-skin.css"}, ${a.react ? `${a.entry ? posix(join(dirname(a.entry), "rnz-lockup.tsx")) : "src/rnz-lockup.tsx"}, ` : ""}public/brand/RICOH-Logo_sRGB_full-colour.png,
  rnz/skin.json, rnz/skin-check.mjs, rnz/skin-report.md, .agents/skills/rnz-skin/SKILL.md
Would change (one line or one marked block each):
  ${a.entry || "index.html"} (import the skin), AGENTS.md (RNZ skin block), package.json ("rnz:skin-check" script if missing)
  workspace: .github/copilot-instructions.md, .github/instructions/${a.git.isRepo && resolve(a.git.root) !== resolve(a.app) ? ", and a pointer block in the repo's own AGENTS.md and CLAUDE.md if they exist" : ""} (marked RNZ blocks)
Nothing else in the app changes: no layout, components, logic or file names.`);
  return css;
}

function cmdSkin(pos, flags) {
  selfUpdate();
  const app = resolveApp(pos[0]);
  if (isTemplateApp(app)) fail(`${app} was made from the RNZ template, so it already has the full brand layer. Use update instead:\n  node "${posix(join(REPO, "bin", "rnz.mjs"))}" update "${posix(app)}"`);
  const a = analyse(app);
  const prior = isSkinnedApp(app) ? readJson(join(app, "rnz", "skin.json")) : null;
  const lightOnly = flags["keep-dark"] ? false : flags["light-only"] ? true : prior ? prior.lightOnly : a.darkClasses === 0;
  printAnalysis(a, lightOnly);
  if (!flags.apply) {
    say(`\nNothing changed. To apply it, run the same command with --apply.`);
    return;
  }
  say("\nApplying the RNZ skin...");
  const result = safely(app, a, {
    label: "The RNZ skin",
    branchBase: "rnz-skin",
    message: `RNZ skin: colours, fonts and weights (rnz-fabric-apps ${TOOL_VERSION})`,
    flags,
  }, (ch) => writeSkin(a, lightOnly, ch));
  if (result.unchanged) return;
  say(`
Done. Skin applied to ${app}.
  Report of hardcoded values for the Copilot pass: ${posix(join(app, "rnz", "skin-report.md"))}
  Preview: npm run dev (in the app folder). Merge ${result.branch || "the changes"} when you're happy.`);
}

function writeSkin(a, lightOnly, ch) {
  const app = a.app;
  const srcDir = a.entry ? dirname(a.entry) : "src";
  const { css, mapped } = buildSkinCss(a, lightOnly);
  ch.write(join(app, srcDir, "rnz-skin.css"), css);

  // Import the skin from the entry, or link it from index.html.
  if (a.entry) {
    const p = join(app, a.entry);
    ch.write(p, addCssImport(read(p), "./rnz-skin.css"));
  } else if (existsSync(join(app, "index.html"))) {
    const p = join(app, "index.html");
    const t = read(p);
    if (!/rnz-skin\.css/.test(t)) ch.write(p, t.replace(/<\/head>/i, `  <link rel="stylesheet" href="/${posix(join(srcDir, "rnz-skin.css"))}" /><!-- RNZ skin -->\n</head>`));
  } else throw new Error("no app entry file or index.html found to load the skin from");

  ch.copy(join(TEMPLATE, "public", "brand", "RICOH-Logo_sRGB_full-colour.png"), join(app, "public", "brand", "RICOH-Logo_sRGB_full-colour.png"));
  if (a.react) {
    const lock = read(join(SKIN, "rnz-lockup.tsx"));
    if (a.ts) ch.write(join(app, srcDir, "rnz-lockup.tsx"), lock);
    else ch.write(join(app, srcDir, "rnz-lockup.jsx"), lock.replace(": { height?: number }", ""));
  }
  ch.copy(join(SKIN, "skin-check.mjs"), join(app, "rnz", "skin-check.mjs"));
  ch.copy(join(SKIN, "skills", "rnz-skin", "SKILL.md"), join(app, ".agents", "skills", "rnz-skin", "SKILL.md"));
  ch.write(join(app, "rnz", "skin.json"), JSON.stringify({
    tool: "rnz-fabric-apps", toolVersion: TOOL_VERSION, templateVersion: templateVersion(),
    lightOnly, css: posix(join(srcDir, "rnz-skin.css")), entry: a.entry, mappedTokens: mapped,
  }, null, 2) + "\n");
  ch.write(join(app, "rnz", "skin-report.md"), skinReport(a, mapped, lightOnly));

  // App instructions: RNZ block at the top of AGENTS.md.
  const agents = join(app, "AGENTS.md");
  ch.write(agents, upsertBlock(existsSync(agents) ? read(agents) : "", read(join(SKIN, "agents-block.md")), "top"));

  // package.json script, only if missing.
  const pkgPath = join(app, "package.json");
  const pkgText = read(pkgPath);
  const pkg = JSON.parse(pkgText);
  pkg.scripts = pkg.scripts || {};
  if (!pkg.scripts["rnz:skin-check"]) {
    pkg.scripts["rnz:skin-check"] = "node rnz/skin-check.mjs";
    const out = { ...pkg };
    const tmp = join(tmpdir(), `rnz-pkg-${process.pid}.json`);
    writeJsonLike(tmp, out, pkgText);
    ch.write(pkgPath, read(tmp));
    rmSync(tmp, { force: true });
  }

  // Workspace instructions so Copilot, Claude and Cursor see the rules wherever the repo is opened.
  const root = a.git.isRepo ? a.git.root : app;
  const relApp = posix(relative(root, app));
  const apps = [...new Set([...skinnedAppsUnder(root).filter((p) => p !== (relApp || ".")), relApp || "."])];
  const list = apps.map((p) => `\`${p === "." ? "this repository's app" : `${p}/`}\``).join(", ");
  const wsBlock = read(join(SKIN, "workspace-block.md")).replace("{{APPS}}", list);
  const ci = join(root, ".github", "copilot-instructions.md");
  ch.write(ci, upsertBlock(existsSync(ci) ? read(ci) : "", wsBlock, "bottom"));
  const slug = relApp ? relApp.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase() : "app";
  const glob = `${relApp ? `${relApp}/` : ""}**/*.{ts,tsx,js,jsx,css,scss,html}`;
  ch.write(join(root, ".github", "instructions", `rnz-ui-${slug}.instructions.md`), read(join(SKIN, "rnz-ui.instructions.md")).replace("{{GLOB}}", glob));
  if (relApp) {
    for (const f of ["AGENTS.md", "CLAUDE.md"]) {
      const p = join(root, f);
      if (existsSync(p)) ch.write(p, upsertBlock(read(p), wsBlock, "bottom"));
    }
  }
  if (existsSync(join(root, ".cursor"))) {
    const rule = read(join(SKIN, "rnz-ui.instructions.md")).replace(/^---[\s\S]*?---/, `---\ndescription: RNZ brand skin rules for UI files (managed by the RNZ skin tool)\nglobs: ${glob}\nalwaysApply: false\n---`);
    ch.write(join(root, ".cursor", "rules", `rnz-ui-${slug}.mdc`), rule);
  }
}

function skinReport(a, mapped, lightOnly) {
  const f = a.scan.findings;
  const rows = f.slice(0, 600).map((x) => `| \`${x.at}\` | ${x.kind} | \`${String(x.value).replace(/\|/g, "\\|")}\` | ${x.suggestion} |`).join("\n");
  const unmapped = a.scan.tokens.filter((t) => !mapped.includes(t.name));
  const toks = unmapped.slice(0, 200).map((t) => `| \`${t.at}\` | \`${t.name}\` | \`${t.value}\` |`).join("\n");
  return `# RNZ skin report

Generated by the RNZ skin tool (rnz-fabric-apps ${TOOL_VERSION}). Regenerated each time the skin runs.

## What the skin already does

- Maps ${mapped.length} of this app's colour and font tokens to RNZ values (\`src/rnz-skin.css\`), so everything
  that uses them (Tailwind token classes such as \`bg-primary\`, \`text-foreground\`, and \`var(--color-...)\`) is on brand.
- Sets the page font to Frutiger, then Arial, and font weights to 300, 400, 500 and 700.
- ${lightOnly ? "Keeps the app in the light theme (RNZ rule)." : `Leaves dark mode as it is (the app has ${a.darkClasses} \`dark:\` classes, so forcing light could clash).`}
${a.datagrid ? "- Styles the Fabric DataGrid header: #F5F5F5, bold grey, 2px red rule, number headings right-aligned.\n" : ""}
## Hardcoded values for the Copilot pass (${f.length})

These bypass the tokens, so the skin can't change them. Replace each **value only** with the suggested
token, following \`.agents/skills/rnz-skin/SKILL.md\`. Don't change anything else.

${f.length ? `| Where | Kind | Value | Suggested |\n|---|---|---|---|\n${rows}${f.length > 600 ? `\n\n...and ${f.length - 600} more (run \`npm run rnz:skin-check -- --json\`).` : ""}` : "None found."}

## App colour tokens the skin didn't map (${unmapped.length})

These are the app's own design tokens with names the RNZ palette doesn't define. Review them: change a
value to an RNZ colour only if its role is clear (surface, text, border, accent). Leave tokens with their
own meaning (status sets, category colours) and list them for the app owner.

${unmapped.length ? `| Where | Token | Value |\n|---|---|---|\n${toks}` : "None."}

## Logo

The RICOH lock-up is available as \`<RicohLockup />\` (\`src/rnz-lockup.tsx\`). Adding it to the header is a small
structural change, so it's left to the app owner.
`;
}

function cmdUpdate(pos, flags) {
  selfUpdate();
  const app = resolveApp(pos[0]);
  if (isSkinnedApp(app)) {
    say("This app has the RNZ skin. Updating it means regenerating the skin from the latest release.");
    return cmdSkin([app], flags);
  }
  if (!isTemplateApp(app)) fail(`${app} has neither the RNZ brand layer nor the RNZ skin. To add the skin:\n  node "${posix(join(REPO, "bin", "rnz.mjs"))}" skin "${posix(app)}"`);

  const sync = join(TEMPLATE, "scripts", "rnz-sync.mjs");
  const preview = run("node", [sync, "--from", REPO], { cwd: app });
  say(preview.out.trim());
  if (preview.code !== 0) fail("The preview failed. Read the messages above.");
  if (!flags.apply) { say("\nNothing changed. To apply it, run the same command with --apply."); return; }

  const a = analyse(app);
  safely(app, a, {
    label: "The RNZ update",
    branchBase: `rnz-update-${templateVersion()}`,
    message: `RNZ brand layer: update to template ${templateVersion()}`,
    flags,
  }, (ch) => {
    const before = snapshot(app);
    const r = run("node", [sync, "--from", REPO, "--apply"], { cwd: app });
    if (r.code !== 0) throw new Error(`the update failed:\n${tail(r.out)}`);
    // Add RNZ npm scripts if missing; never overwrite the app's own.
    const pkgPath = join(app, "package.json");
    const text = read(pkgPath); const pkg = JSON.parse(text); pkg.scripts = pkg.scripts || {};
    const wanted = { "rnz:check": "node scripts/rnz-check.mjs", "rnz:sync": "node scripts/rnz-sync.mjs", "prebuild:fabric": "node scripts/rnz-check.mjs" };
    let changed = false;
    for (const [k, v] of Object.entries(wanted)) if (!pkg.scripts[k]) { pkg.scripts[k] = v; changed = true; }
    if (changed) { const tmp = join(tmpdir(), `rnz-pkg-${process.pid}.json`); writeJsonLike(tmp, pkg, text); writeFileSync(pkgPath, read(tmp)); rmSync(tmp, { force: true }); }
    diffSnapshot(app, before, ch);
    say(tail(r.out, 6));
  });
  const chk = run("npm", ["run", "rnz:check"], { cwd: app });
  say(tail(chk.out, 4));
}

/** For the update path: record files before rnz-sync runs, then register what changed so undo works. */
function snapshot(app) {
  const m = new Map();
  const walkAll = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (["node_modules", ".git", "dist"].includes(e.name)) continue;
      const p = join(d, e.name);
      if (e.isDirectory()) walkAll(p); else m.set(p, readFileSync(p));
    }
  };
  walkAll(app);
  return m;
}
function diffSnapshot(app, before, ch) {
  const now = snapshot(app);
  for (const [p, buf] of now) {
    if (!before.has(p)) { ch.created.push(p); if (posix(p).includes("/rnz/backup")) ch.noCommit.push(p); }
    else if (!before.get(p).equals(buf)) ch.modified.push(p);
  }
}

function cmdCheck(pos) {
  selfUpdate();
  const app = resolveApp(pos[0]);
  if (isTemplateApp(app)) {
    const r = run("node", ["scripts/rnz-check.mjs"], { cwd: app, capture: false });
    process.exit(r.code);
  }
  const r = run("node", [join(SKIN, "skin-check.mjs"), app], { capture: false });
  if (!isSkinnedApp(app)) say("\nThis app doesn't have the RNZ skin yet. The list above is what /rnz-skin would hand to Copilot.");
  process.exit(isSkinnedApp(app) ? r.code : 0);
}

function help() {
  say(`RNZ tool ${TOOL_VERSION} (template ${templateVersion()})

  node bin/rnz.mjs install
      Add /rnz-new, /rnz-skin, /rnz-update and /rnz-check to Copilot Chat (once per person).
  node bin/rnz.mjs new NAME [--workspace-id ID] [--agents LIST] [--parent DIR] [--no-open]
      Create a new branded Fabric app (default folder C:\\dev on Windows).
      --agents adds optional agents: any of builder,qa,reporter, or all, or none (the default).
        builder   builds screens following the RNZ skills
        qa        reviews changes and reports problems, never fixes them
        reporter  only updates the app's version and records each change in CHANGELOG.md
  node bin/rnz.mjs skin [FOLDER] [--apply] [--light-only | --keep-dark] [--no-verify]
      Existing app: change colours, fonts and weights to RNZ without changing its structure.
      Analyses only, unless --apply. Works on a new branch, checks build and tests before and
      after, and undoes itself if anything that passed before now fails.
  node bin/rnz.mjs update [FOLDER] [--apply]
      Bring an RNZ template app or a skinned app up to the latest release.
  node bin/rnz.mjs check [FOLDER]
      Report brand problems. Changes nothing.`);
}

const [cmd, ...rest] = process.argv.slice(2);
const { flags, pos } = parseArgs(rest);
const major = Number(process.versions.node.split(".")[0]);
if (major < 20) fail(`Node ${process.versions.node} is too old. Install Node 20 or later.`);
switch (cmd) {
  case "install": cmdInstall(); break;
  case "new": cmdNew(pos, flags); break;
  case "skin": cmdSkin(pos, flags); break;
  case "update": cmdUpdate(pos, flags); break;
  case "check": cmdCheck(pos, flags); break;
  case "version": case "--version": say(`${TOOL_VERSION} (template ${templateVersion()})`); break;
  default: help(); if (cmd && cmd !== "help" && cmd !== "--help") process.exit(1);
}
