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
for (const f of [...AGENTS.map((a) => `rnz-${a}.md`), "skin/rnz-builder.md", "skin/rnz-qa.md"]) {
  const text = readFileSync(join(REPO, "agents", f), "utf8");
  const fm = front(text);
  const name = f.replace(/^skin\//, "").replace(/\.md$/, "");
  ok(fm && fm.name === name && fm.description && fm.description.length > 40, `${f} has a name matching its file and a description`);
  ok(!/[\u2013\u2014]/.test(text), `${f} has no em or en dashes`);
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
  ok(!readFileSync(join(dir, ".claude", "agents", "rnz-builder.md"), "utf8").includes("This app is in"), "new apps at the repo root get no folder note");
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
  const rr = readFileSync(join(dir, ".claude", "agents", "rnz-reporter.md"), "utf8");
  ok(/change log, `CHANGELOG\.md`, saying/.test(rr) && /":\/CHANGELOG\.md"/.test(rr) && !rr.includes("{{"), "new app's reporter points at CHANGELOG.md");
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

// Existing apps: `rnz agents` on a skinned app in a subfolder, with the repo's own VERSIONING.md
{
  const { spawnSync } = await import("node:child_process");
  const env = { ...process.env, GIT_AUTHOR_NAME: "RNZ test", GIT_AUTHOR_EMAIL: "rnz@example.com", GIT_COMMITTER_NAME: "RNZ test", GIT_COMMITTER_EMAIL: "rnz@example.com" };
  const sh = (cmd, args, cwd) => spawnSync(cmd, args, { cwd, env, encoding: "utf8" });
  const rnz = (args, cwd) => sh(process.execPath, [join(REPO, "bin", "rnz.mjs"), ...args], cwd);
  const root = mkdtempSync(join(tmpdir(), "rnz-agents-existing-"));
  const appDir = join(root, "My App");
  mkdirSync(join(appDir, "src"), { recursive: true });
  writeFileSync(join(appDir, "package.json"), JSON.stringify({ name: "my-app", version: "0.1.0", private: true, scripts: { build: "node -e 0", test: "node -e 0", lint: "node -e 0" }, dependencies: { react: "^19.0.0" } }, null, 2) + "\n");
  writeFileSync(join(appDir, "src", "index.css"), "@theme {\n  --color-primary: #0055ff;\n}\n");
  writeFileSync(join(appDir, "src", "main.tsx"), 'import "./index.css";\n');
  writeFileSync(join(appDir, "index.html"), '<script type="module" src="/src/main.tsx"></script>\n');
  writeFileSync(join(root, "VERSIONING.md"), "# Versioning\n\n- **Tracking version:** `0.3.5`\n");
  writeFileSync(join(root, ".gitignore"), "node_modules\n.claude/\n");
  sh("git", ["init", "-q", "-b", "main"], root); sh("git", ["add", "-A"], root); sh("git", ["commit", "-q", "-m", "base"], root);

  const plain = rnz(["agents", appDir, "--agents", "all"], root);
  ok(plain.status !== 0 && /RNZ brand layer/.test(plain.stderr), "refuses an app without the RNZ skin or template");

  ok(rnz(["skin", appDir, "--apply", "--no-verify"], root).status === 0, "fixture app takes the RNZ skin");
  const skinHead = sh("git", ["rev-parse", "HEAD"], root).stdout.trim();
  const look = rnz(["agents", appDir], root);
  ok(look.status === 0 && /Agents set up: none/.test(look.stdout) && /VERSIONING\.md at the repository root/.test(look.stdout), "without --agents it only reports, and finds the repo's change log");
  ok(sh("git", ["rev-parse", "HEAD"], root).stdout.trim() === skinHead, "reporting changes nothing");

  const r = rnz(["agents", appDir, "--agents", "all"], root);
  ok(r.status === 0 && sh("git", ["rev-parse", "--abbrev-ref", "HEAD"], root).stdout.trim() === "rnz-agents", `adds the agents on branch rnz-agents${r.status ? `\n${r.stdout}\n${r.stderr}` : ""}`);
  const changed = sh("git", ["diff", "--name-only", skinHead, "HEAD"], root).stdout.trim().split("\n").sort();
  ok(JSON.stringify(changed) === JSON.stringify([".claude/agents/rnz-builder.md", ".claude/agents/rnz-qa.md", ".claude/agents/rnz-reporter.md"]), "only adds the three agent files at the repository root, even when .claude is gitignored");
  ok(sh("git", ["status", "--porcelain"], root).stdout.trim() === "", "commits them (clean tree)");
  const b = readFileSync(join(root, ".claude", "agents", "rnz-builder.md"), "utf8");
  ok(/This app is in `My App\/`/.test(b) && /npm run rnz:skin-check\nnpm run lint\nnpm test\nnpm run build/.test(b) && /rnz-skin\/SKILL\.md/.test(b), "builder is scoped to the app folder, with its own checks and the skin rules");
  ok(front(readFileSync(join(root, ".claude", "agents", "rnz-qa.md"), "utf8")).tools === "Read, Grep, Glob, Bash", "QA for existing apps can't edit or write files");
  const rp = readFileSync(join(root, ".claude", "agents", "rnz-reporter.md"), "utf8");
  ok(/`VERSIONING\.md` at the repository root/.test(rp) && /":\/VERSIONING\.md"/.test(rp) && /its own rules/.test(rp), "reporter uses the repo's VERSIONING.md and its rules");
  ok(!existsSync(join(appDir, "CHANGELOG.md")) && JSON.parse(readFileSync(join(appDir, "package.json"), "utf8")).version === "0.1.0", "no new changelog and no version change when a change log exists");
  for (const f of ["rnz-builder", "rnz-qa", "rnz-reporter"]) ok(!readFileSync(join(root, ".claude", "agents", `${f}.md`), "utf8").includes("{{"), `${f} has no unfilled placeholders`);
  const again = rnz(["agents", appDir, "--agents", "all"], root);
  ok(again.status === 0 && /Already up to date/.test(again.stdout) && sh("git", ["rev-parse", "--abbrev-ref", "HEAD"], root).stdout.trim() === "rnz-agents", "a second run changes nothing");
  rmSync(root, { recursive: true, force: true });
}

console.log(failures ? `\n${failures} check(s) failed.` : "\nAll agent checks passed.");
process.exit(failures ? 1 : 0);
