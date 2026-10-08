#!/usr/bin/env node
// Maintainer test for the RNZ tool (bin/rnz.mjs). Runs in the Template checks workflow.
// Builds small throwaway apps in a temp folder and proves the skin:
//   1. analyses without changing anything,
//   2. applies on a branch, maps the app's tokens, wires the import and commits,
//   3. changes nothing on a second run,
//   4. undoes itself completely when it would break a build that passed before,
//   5. refuses to touch an app made from the RNZ template (that uses update).
// Usage: node scripts/test-skin.mjs

import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync, cpSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const RNZ = join(REPO, "bin", "rnz.mjs");
const env = { ...process.env, GIT_AUTHOR_NAME: "RNZ test", GIT_AUTHOR_EMAIL: "rnz@example.com", GIT_COMMITTER_NAME: "RNZ test", GIT_COMMITTER_EMAIL: "rnz@example.com" };
let failures = 0;

const sh = (cmd, args, cwd) => spawnSync(cmd, args, { cwd, env, encoding: "utf8" });
const rnz = (args, cwd) => sh(process.execPath, [RNZ, ...args], cwd);
function ok(cond, msg) { console.log(`${cond ? "PASS" : "FAIL"}  ${msg}`); if (!cond) failures++; }
const status = (cwd) => sh("git", ["status", "--porcelain"], cwd).stdout.trim();
const branch = (cwd) => sh("git", ["rev-parse", "--abbrev-ref", "HEAD"], cwd).stdout.trim();

function fixture(root, { buildBreaksWithSkin = false } = {}) {
  mkdirSync(join(root, "app", "src"), { recursive: true });
  const app = join(root, "app");
  writeFileSync(join(app, "package.json"), JSON.stringify({ name: "fx", private: true, scripts: { build: "node build.mjs", test: "node test.mjs" }, dependencies: { react: "^19.0.0" } }, null, 2) + "\n");
  writeFileSync(join(app, "package-lock.json"), '{"lockfileVersion":3,"packages":{}}\n');
  mkdirSync(join(app, "node_modules"));
  writeFileSync(join(app, "build.mjs"), buildBreaksWithSkin
    ? 'import { existsSync } from "node:fs"; if (existsSync("src/rnz-skin.css")) { console.error("broken"); process.exit(1); }\n'
    : "process.exit(0);\n");
  writeFileSync(join(app, "test.mjs"), "process.exit(0);\n");
  writeFileSync(join(app, "src", "index.css"), "@theme {\n  --color-primary: #0055ff;\n  --color-background: #fafafa;\n  --color-foreground: #111111;\n}\nbody { font-family: Inter; }\n");
  writeFileSync(join(app, "src", "main.tsx"), 'import "./index.css";\nconsole.log("app");\n');
  writeFileSync(join(app, "index.html"), '<!doctype html><html><head></head><body><script type="module" src="/src/main.tsx"></script></body></html>\n');
  writeFileSync(join(root, ".gitignore"), "node_modules\n");
  writeFileSync(join(root, "AGENTS.md"), "# Repo rules\n\nKeep these.\n");
  sh("git", ["init", "-q", "-b", "main"], root);
  sh("git", ["add", "-A"], root);
  sh("git", ["commit", "-q", "-m", "base"], root);
  return app;
}

// 1 to 3: happy path in a subfolder app
{
  const root = mkdtempSync(join(tmpdir(), "rnz-skin-ok-"));
  const app = fixture(root);
  const a = rnz(["skin", app], root);
  ok(a.status === 0 && /Tokens the skin would map to RNZ values: 3/.test(a.stdout), "analyse finds the app's 3 tokens");
  ok(status(root) === "", "analyse changes nothing");

  const b = rnz(["skin", app, "--apply"], root);
  ok(b.status === 0, `apply succeeds${b.status ? `\n${b.stdout}\n${b.stderr}` : ""}`);
  ok(branch(root) === "rnz-skin", "works on branch rnz-skin");
  ok(status(root) === "", "changes are committed (clean tree)");
  const css = readFileSync(join(app, "src", "rnz-skin.css"), "utf8");
  ok(/--color-primary: #CF142B;/.test(css) && /--color-foreground: #666666;/.test(css), "maps primary and foreground to RNZ values");
  ok(readFileSync(join(app, "src", "main.tsx"), "utf8").includes('import "./rnz-skin.css";'), "imports the skin from the entry");
  ok(existsSync(join(app, "public", "brand", "RICOH-Logo_sRGB_full-colour.png")), "adds the lock-up file with its exact name");
  ok(existsSync(join(app, ".agents", "skills", "rnz-skin", "SKILL.md")), "adds the rnz-skin skill");
  const agents = readFileSync(join(root, "AGENTS.md"), "utf8");
  ok(agents.startsWith("# Repo rules") && agents.includes("RNZ-SKIN:BEGIN"), "keeps the repo's own AGENTS.md and appends a marked block");
  ok(existsSync(join(root, ".github", "instructions", "rnz-ui-app.instructions.md")), "adds workspace UI instructions");
  ok(readFileSync(join(app, "src", "index.css"), "utf8").includes("#0055ff"), "never edits the app's own CSS");

  const c = rnz(["skin", app, "--apply"], root);
  ok(c.status === 0 && /Already up to date/.test(c.stdout) && branch(root) === "rnz-skin", "second run changes nothing");
  const chk = rnz(["check", app], root);
  ok(chk.status === 0 && /Skin check passed/.test(chk.stdout), "check passes after the skin");
  rmSync(root, { recursive: true, force: true });
}

// 4: undo when a build breaks
{
  const root = mkdtempSync(join(tmpdir(), "rnz-skin-undo-"));
  const app = fixture(root, { buildBreaksWithSkin: true });
  const r = rnz(["skin", app, "--apply"], root);
  ok(r.status === 3 && /was undone/.test(r.stdout), "stops and reports when the build breaks");
  ok(branch(root) === "main" && status(root) === "", "returns to the original branch with a clean tree");
  ok(!existsSync(join(app, "src", "rnz-skin.css")) && !existsSync(join(app, "rnz")), "removes every file it added");
  ok(sh("git", ["branch", "--list", "rnz-skin"], root).stdout.trim() === "", "deletes its branch");
  rmSync(root, { recursive: true, force: true });
}

// 5: template apps use update, not skin
{
  const root = mkdtempSync(join(tmpdir(), "rnz-skin-tpl-"));
  const app = join(root, "tpl");
  mkdirSync(join(app, "rnz"), { recursive: true });
  cpSync(join(REPO, "templates", "rnz-data-app", "package.json"), join(app, "package.json"));
  cpSync(join(REPO, "templates", "rnz-data-app", "rnz", "brand-manifest.json"), join(app, "rnz", "brand-manifest.json"));
  const r = rnz(["skin", app], root);
  ok(r.status !== 0 && /Use update instead/.test(r.stderr), "sends RNZ template apps to update");
  rmSync(root, { recursive: true, force: true });
}

console.log(failures ? `\n${failures} check(s) failed.` : "\nAll RNZ tool checks passed.");
process.exit(failures ? 1 : 0);
