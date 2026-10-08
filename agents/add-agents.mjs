// Optional agents for new RNZ apps: `node bin/rnz.mjs new NAME --agents builder,qa,reporter`.
// Each agent is one Claude-format file in the app's .claude/agents folder, which both Claude Code
// and Copilot in VS Code read as a custom agent. The reporter also gets a CHANGELOG.md and starts
// the app at version 0.1.0 (otherwise a new app carries the template's version number).

import { existsSync, readFileSync, writeFileSync, mkdirSync, copyFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
export const AGENTS = ["builder", "qa", "reporter"];
export const START_VERSION = "0.1.0";

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

/** Copy the chosen agents into the app. Returns the app-relative paths it wrote. */
export function addAgents(app, list, { appName, templateVersion, date = new Date() } = {}) {
  const written = [];
  if (!list.length) return written;
  const dir = join(app, ".claude", "agents");
  mkdirSync(dir, { recursive: true });
  for (const a of list) {
    copyFileSync(join(HERE, `rnz-${a}.md`), join(dir, `rnz-${a}.md`));
    written.push(`.claude/agents/rnz-${a}.md`);
  }
  if (list.includes("reporter")) {
    const log = join(app, "CHANGELOG.md");
    if (!existsSync(log)) {
      writeFileSync(log, `# Changelog

What changed in ${appName || "this app"}, newest first. The rnz-reporter agent updates the version number and adds an entry after each change.

## ${START_VERSION} (${nzDate(date)})

- Created from the RNZ Data App template${templateVersion ? ` ${templateVersion}` : ""}.
`);
      written.push("CHANGELOG.md");
      if (setVersion(join(app, "package.json"), START_VERSION, false)) written.push("package.json");
      if (setVersion(join(app, "package-lock.json"), START_VERSION, true)) written.push("package-lock.json");
    }
  }
  return written;
}
