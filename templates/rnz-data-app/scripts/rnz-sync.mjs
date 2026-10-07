#!/usr/bin/env node
// rnz-sync: pull the latest RNZ brand layer from the template into this app.
//
//   npm run rnz:sync -- --from <path>            preview what would change (default)
//   npm run rnz:sync -- --from <path> --apply    write the changes
//
// <path> is a local clone of the RNZ template gallery (rnz-fabric-apps) or the
// rnz-data-app folder inside it. Only brand-managed files listed in
// rnz/brand-manifest.json are touched. Your screens, queries and App.tsx are not.
// Files with local edits are backed up to rnz/backup/<timestamp>/ before being replaced.
// Brand-managed file: update it in the template, then run `npm run rnz:sync`.
// It never renames or deletes files: references depend on exact names.

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync, copyFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, dirname, sep } from "node:path";

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const fromIdx = args.indexOf("--from");
const app = process.cwd();

if (fromIdx === -1 || !args[fromIdx + 1]) {
    console.error("Usage: npm run rnz:sync -- --from <path to rnz-fabric-apps or rnz-data-app> [--apply]");
    process.exit(2);
}

let src = args[fromIdx + 1];
if (existsSync(join(src, "templates", "rnz-data-app"))) src = join(src, "templates", "rnz-data-app");
const manifestPath = join(src, "rnz", "brand-manifest.json");
if (!existsSync(manifestPath)) {
    console.error(`No rnz/brand-manifest.json found under ${src}. Point --from at the RNZ template.`);
    process.exit(2);
}

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
// Line endings are ignored, so a Windows checkout (CRLF) doesn't count as an edit.
// Keep identical to brandHash() in rnz-check.mjs and the template repo's root scripts/rnz-lock.mjs.
const BINARY = /\.(png|jpe?g|gif|webp|ico|woff2?|ttf|otf|pdf)$/i;
const sha = (buf, name) => {
    const data = BINARY.test(name) ? buf : Buffer.from(buf.toString("utf8").replace(/\r\n/g, "\n"), "utf8");
    return createHash("sha256").update(data).digest("hex");
};
const posix = (p) => p.split(sep).join("/");

function listDir(base, rel) {
    const out = [];
    const abs = join(base, rel);
    if (!existsSync(abs)) return out;
    for (const name of readdirSync(abs)) {
        const childRel = join(rel, name);
        if (statSync(join(base, childRel)).isDirectory()) out.push(...listDir(base, childRel));
        else out.push(posix(childRel));
    }
    return out;
}

const managed = new Set(manifest.files);
for (const d of manifest.directories) for (const f of listDir(src, d)) managed.add(f);

const lockPath = join(app, "rnz", "brand-lock.json");
const lock = existsSync(lockPath) ? JSON.parse(readFileSync(lockPath, "utf8")) : { files: {} };
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupDir = join(app, "rnz", "backup", stamp);

const report = { added: [], updated: [], unchanged: [], localEditsReplaced: [], blocks: [] };
const newLock = { templateVersion: manifest.templateVersion, syncedAt: new Date().toISOString(), files: {} };

for (const rel of [...managed].sort()) {
    const from = join(src, rel);
    if (!existsSync(from)) continue;
    const to = join(app, rel);
    const incoming = readFileSync(from);
    newLock.files[rel] = sha(incoming, rel);

    if (!existsSync(to)) {
        report.added.push(rel);
        if (apply) {
            mkdirSync(dirname(to), { recursive: true });
            writeFileSync(to, incoming);
        }
        continue;
    }
    const current = readFileSync(to);
    if (sha(current, rel) === sha(incoming, rel)) {
        report.unchanged.push(rel);
        continue;
    }
    const locallyEdited = lock.files[rel] && lock.files[rel] !== sha(current, rel);
    (locallyEdited ? report.localEditsReplaced : report.updated).push(rel);
    if (apply) {
        if (locallyEdited || !lock.files[rel]) {
            mkdirSync(dirname(join(backupDir, rel)), { recursive: true });
            copyFileSync(to, join(backupDir, rel));
        }
        writeFileSync(to, incoming);
    }
}

// Marked blocks (the RNZ section of AGENTS.md). Text outside the markers is kept.
for (const b of manifest.blocks ?? []) {
    const from = join(src, b.file);
    const to = join(app, b.file);
    if (!existsSync(from)) continue;
    const srcText = readFileSync(from, "utf8");
    const s = srcText.indexOf(b.begin);
    const e = srcText.indexOf(b.end);
    if (s === -1 || e === -1) continue;
    const block = srcText.slice(s, e + b.end.length);
    let appText = existsSync(to) ? readFileSync(to, "utf8") : "";
    const as = appText.indexOf(b.begin);
    const ae = appText.indexOf(b.end);
    let next;
    if (as !== -1 && ae !== -1) next = appText.slice(0, as) + block + appText.slice(ae + b.end.length);
    else next = block + "\n\n" + appText;
    if (next !== appText) {
        report.blocks.push(b.file);
        if (apply) writeFileSync(to, next);
    }
}

if (apply) {
    mkdirSync(dirname(lockPath), { recursive: true });
    writeFileSync(lockPath, JSON.stringify(newLock, null, 2) + "\n");
}

const show = (label, list) => list.length && console.log(`\n${label} (${list.length}):\n  ${list.join("\n  ")}`);
console.log(`RNZ sync from ${posix(src)} (template ${manifest.templateVersion})${apply ? "" : ". Preview only"}`);
show("New files", report.added);
show("Updated", report.updated);
show("Local edits that will be replaced (backed up first)", report.localEditsReplaced);
show("RNZ block refreshed", report.blocks);
console.log(`\n${report.unchanged.length} file(s) already current.`);
if (!apply) console.log("\nNothing written. Run again with --apply to make these changes.");
else console.log(`\nDone. Run \`npm run rnz:check\` and \`npm run build\` next.${report.localEditsReplaced.length ? ` Backups: rnz/backup/${stamp}/` : ""}`);
