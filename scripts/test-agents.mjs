#!/usr/bin/env node
// Maintainer test for the optional agents in `rnz new --agents` (agents/add-agents.mjs).
// Runs in the Template checks workflow. Usage: node scripts/test-agents.mjs

import { mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync, cpSync, mkdirSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { parseAgents, addAgents, AGENTS } from "../agents/add-agents.mjs";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
let failures = 0;
function ok(cond, msg) { console.log(`${cond ? "PASS" : "FAIL"}  ${msg}`); if (!cond) failures++; }
const throws = (fn) => { try { fn(); return false; } catch { return true; } };
const front = (text) => {
  const m = text.match(/^---\n([\s\S]*?)\n---\n/);
  return m ? Object.fromEntries(m[1].split("\n").map((l) => l.split(/:\s(.*)/s).slice(0, 2))) : null;
};

// Choices
ok(parseAgents(undefined) === undefined, "no --agents means not given");
ok(JSON.stringify(parseAgents("none")) === "[]", "none adds no agents");
ok(JSON.stringify(parseAgents("all")) === JSON.stringify(AGENTS), "all adds builder, qa and reporter");
ok(JSON.stringify(parseAgents("Reporter, builder")) === '["builder","reporter"]', "any mix, any order, any case");
ok(throws(() => parseAgents("builder,tester")), "unknown agent names are refused");

// Agent files: valid for Claude Code and Copilot, and the rules each one depends on
const tools = (t) => (t || "").split(",").map((s) => s.trim()).filter(Boolean);
for (const a of AGENTS) {
  const text = readFileSync(join(REPO, "agents", `rnz-${a}.md`), "utf8");
  const fm = front(text);
  ok(fm && fm.name === `rnz-${a}` && fm.description && fm.description.length > 40, `rnz-${a} has a name matching its file and a description`);
  ok(!/[\u2013\u2014]/.test(text), `rnz-${a} has no em or en dashes`);
}
const qa = front(readFileSync(join(REPO, "agents", "rnz-qa.md"), "utf8"));
ok(!tools(qa.tools).some((t) => ["Edit", "Write"].includes(t)), "QA can't edit or write files");
const rep = readFileSync(join(REPO, "agents", "rnz-reporter.md"), "utf8");
ok(/Never change any other file/.test(rep) && /Never commit, push or deploy/.test(rep), "reporter only touches the version and changelog");
for (const p of ["rnz-new-app", "rnz-app-brand", "rnz-app-patterns", "rnz-app-content", "rnz-app-qa"]) {
  ok(existsSync(join(REPO, "templates", "rnz-data-app", ".agents", "skills", p, "SKILL.md")), `skill the agents point to exists: ${p}`);
}

// Adding to an app
function app() {
  const dir = mkdtempSync(join(tmpdir(), "rnz-agents-"));
  cpSync(join(REPO, "templates", "rnz-data-app", "package.json"), join(dir, "package.json"));
  cpSync(join(REPO, "templates", "rnz-data-app", "package-lock.json"), join(dir, "package-lock.json"));
  return dir;
}
{
  const dir = app();
  const before = readFileSync(join(dir, "package.json"), "utf8");
  const w = addAgents(dir, ["builder", "qa"], { appName: "demo", templateVersion: "1.2.0" });
  ok(w.length === 2 && existsSync(join(dir, ".claude", "agents", "rnz-builder.md")) && existsSync(join(dir, ".claude", "agents", "rnz-qa.md")), "builder and qa are added to .claude/agents");
  ok(!existsSync(join(dir, ".claude", "agents", "rnz-reporter.md")) && !existsSync(join(dir, "CHANGELOG.md")), "reporter and changelog are left out when not chosen");
  ok(readFileSync(join(dir, "package.json"), "utf8") === before, "version is unchanged without the reporter");
  rmSync(dir, { recursive: true, force: true });
}
{
  const dir = app();
  const before = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
  const w = addAgents(dir, ["reporter"], { appName: "demo", templateVersion: "1.2.0", date: new Date("2026-10-08T20:00:00Z") });
  const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
  const lock = JSON.parse(readFileSync(join(dir, "package-lock.json"), "utf8"));
  ok(pkg.version === "0.1.0" && lock.version === "0.1.0" && lock.packages[""].version === "0.1.0", "reporter starts the app at 0.1.0 in package.json and package-lock.json");
  ok(JSON.stringify({ ...pkg, version: before.version }) === JSON.stringify(before), "nothing else in package.json changes");
  const log = readFileSync(join(dir, "CHANGELOG.md"), "utf8");
  ok(/## 0\.1\.0 \(9 October 2026\)/.test(log) && /template 1\.2\.0/.test(log), "changelog starts with 0.1.0, the NZ date and the template version");
  ok(w.includes("CHANGELOG.md") && w.includes("package.json") && w.includes("package-lock.json"), "reports every file it wrote");
  writeFileSync(join(dir, "CHANGELOG.md"), "# Mine\n");
  addAgents(dir, ["reporter"], { appName: "demo" });
  ok(readFileSync(join(dir, "CHANGELOG.md"), "utf8") === "# Mine\n", "never overwrites an existing changelog");
  rmSync(dir, { recursive: true, force: true });
}
{
  const dir = mkdtempSync(join(tmpdir(), "rnz-agents-none-"));
  mkdirSync(join(dir, "src"));
  ok(addAgents(dir, []).length === 0 && !existsSync(join(dir, ".claude")), "none writes nothing");
  rmSync(dir, { recursive: true, force: true });
}

console.log(failures ? `\n${failures} check(s) failed.` : "\nAll agent checks passed.");
process.exit(failures ? 1 : 0);
