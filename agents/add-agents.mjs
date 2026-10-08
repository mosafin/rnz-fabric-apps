// Optional builder, QA and reporter agents for RNZ apps.
//   New apps:      node bin/rnz.mjs new NAME --agents builder,qa,reporter
//   Existing apps: node bin/rnz.mjs agents FOLDER --agents builder,qa,reporter
// Each agent is one Claude-format file in the repository's .claude/agents folder, which both
// Claude Code and Copilot in VS Code read as a custom agent. Apps made from the RNZ template get
// the template versions (agents/*.md); apps with the RNZ skin get agents/skin/*.md, scoped to the
// app's folder and its own checks. The reporter uses the change log the app already has
// (VERSIONING.md, CHANGELOG.md ...) and follows its rules; only a new app gets CHANGELOG.md and
// version 0.1.0 (otherwise it carries the template's version number).

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
export const AGENTS = ["builder", "qa", "reporter"];
export const START_VERSION = "0.1.0";
const LOG_NAMES = ["VERSIONING.md", "CHANGELOG.md", "CHANGES.md", "HISTORY.md"];
const posix = (p) => p.split(sep).join("/");

/** --agents value to a list. undefined when not given; throws on unknown names. */
export function parseAgents(value) {
  if (value === undefined) return undefined;
  const v = value === true ? "" : String(value).toLowerCase().trim();
  if (["", "none", "no"].includes(v)) return [];
  if (["all", "yes"].includes(v)) return [...AGENTS];
  const list = v.split(/[,\s]+/).filter(Boolean);
  const bad = list.filter((a) => !AGENTS.includes(a));
  if (bad.length) throw new Error(`Unknown agent: ${bad.join(", ")}. Choose from builder, qa and reporter, or none.`);
  return AGENTS.filter((a) => list.includes(a));
}

export const nzDate = (d = new Date()) =>
  new Intl.DateTimeFormat("en-NZ", { day: "numeric", month: "long", year: "numeric", timeZone: "Pacific/Auckland" }).format(d);

/** The change log the app already has: in the app folder first, then the repository root. */
export function findChangeLog(app, root = app) {
  for (const dir of [...new Set([app, root])]) {
    for (const n of LOG_NAMES) if (existsSync(join(dir, n))) return logInfo(join(dir, n), app, root);
  }
  return null;
}

export function logInfo(file, app, root = app) {
  const inApp = dirname(file) === app;
  const rel = posix(relative(root, file));
  return {
    file,
    display: inApp && app === root ? `\`${rel}\`` : inApp ? `\`${posix(relative(app, file))}\` in the app folder` : `\`${rel}\` at the repository root`,
    gitPath: `:/${rel}`,
  };
}

/** Commands the builder and QA run in a skinned app, from its own package.json scripts. */
export function skinChecks(pkg) {
  const s = (pkg && pkg.scripts) || {};
  const out = [s["rnz:skin-check"] ? "npm run rnz:skin-check" : "node rnz/skin-check.mjs"];
  if (s.lint) out.push("npm run lint");
  if (s.test && !/no test specified/.test(s.test)) out.push("npm test");
  if (s.build) out.push("npm run build");
  return out.join("\n");
}

/** The agent file's text for this app. kind: "template" or "skin". appRel: app folder from the repo root ("" at the root). */
export function renderAgent(agent, { kind = "template", appRel = "", checks = "", log }) {
  const src = agent !== "reporter" && kind === "skin" ? join(HERE, "skin", `rnz-${agent}.md`) : join(HERE, `rnz-${agent}.md`);
  let text = readFileSync(src, "utf8")
    .replaceAll("{{CHECKS}}", checks)
    .replaceAll("{{LOG}}", log ? log.display : "`CHANGELOG.md`")
    .replaceAll("{{LOG_GIT}}", log ? log.gitPath : ":/CHANGELOG.md");
  if (appRel) {
    text = text.replace(/^(---\n[\s\S]*?\n---\n)/, `$1\n**This app is in \`${appRel}/\`** in this repository. Run commands in that folder. File paths below are relative to it unless they say "repository". Don't change anything outside it unless the person asks.\n`);
  }
  return text;
}

function setVersion(file, version, lock) {
  if (!existsSync(file)) return false;
  const text = readFileSync(file, "utf8");
  const json = JSON.parse(text);
  json.version = version;
  if (lock && json.packages && json.packages[""]) json.packages[""].version = version;
  const indent = (text.match(/\n([ \t]+)"/) || [, "  "])[1];
  const eol = text.includes("\r\n") ? "\r\n" : "\n";
  writeFileSync(file, JSON.stringify(json, null, indent).replace(/\n/g, eol) + (text.endsWith("\n") ? eol : ""));
  return true;
}

/** Starting text for an app's new CHANGELOG.md. */
export function startChangeLog({ appName, version, firstLine, date = new Date() }) {
  return `# Changelog

What changed in ${appName || "this app"}, newest first. The rnz-reporter agent updates the version number and adds an entry after each change.

## ${version} (${nzDate(date)})

- ${firstLine}
`;
}

/** New apps: write the chosen agents. Returns the app-relative paths it wrote. */
export function addAgents(app, list, { appName, templateVersion, date = new Date() } = {}) {
  const written = [];
  if (!list.length) return written;
  mkdirSync(join(app, ".claude", "agents"), { recursive: true });
  const log = list.includes("reporter") ? findChangeLog(app) || logInfo(join(app, "CHANGELOG.md"), app) : null;
  for (const a of list) {
    writeFileSync(join(app, ".claude", "agents", `rnz-${a}.md`), renderAgent(a, { kind: "template", log }));
    written.push(`.claude/agents/rnz-${a}.md`);
  }
  if (log && !existsSync(log.file)) {
    writeFileSync(log.file, startChangeLog({ appName, version: START_VERSION, date, firstLine: `Created from the RNZ Data App template${templateVersion ? ` ${templateVersion}` : ""}.` }));
    written.push(posix(relative(app, log.file)));
    if (setVersion(join(app, "package.json"), START_VERSION, false)) written.push("package.json");
    if (setVersion(join(app, "package-lock.json"), START_VERSION, true)) written.push("package-lock.json");
  }
  return written;
}
