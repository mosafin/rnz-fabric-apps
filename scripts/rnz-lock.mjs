#!/usr/bin/env node
// rnz-lock: maintainer script. Records the fingerprint of every brand-managed file in
// templates/rnz-data-app/rnz/brand-lock.json, so apps can tell brand files from local edits.
//
//   node scripts/rnz-lock.mjs            write the lock (run after changing any brand file)
//   node scripts/rnz-lock.mjs --verify   exit 1 if the lock is out of date (CI runs this)
//
// Lives at the repo root on purpose: it is never copied into apps, because running it in
// an app would mark local edits as approved brand files.
// Line endings are ignored. Keep brandHash() identical to rnz-check.mjs and rnz-sync.mjs.

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, sep, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");
const tpl = join(repo, "templates", "rnz-data-app");
const verify = process.argv.includes("--verify");

function brandHash(path) {
    const buf = readFileSync(path);
    const binary = /\.(png|jpe?g|gif|webp|ico|woff2?|ttf|otf|pdf)$/i.test(path);
    const data = binary ? buf : Buffer.from(buf.toString("utf8").replace(/\r\n/g, "\n"), "utf8");
    return createHash("sha256").update(data).digest("hex");
}

const walk = (base, rel) => {
    const abs = join(base, rel);
    if (!existsSync(abs)) return [];
    return readdirSync(abs).flatMap((n) => {
        const r = join(rel, n);
        return statSync(join(base, r)).isDirectory() ? walk(base, r) : [r.split(sep).join("/")];
    });
};

const manifest = JSON.parse(readFileSync(join(tpl, "rnz", "brand-manifest.json"), "utf8"));
const files = [...new Set([...manifest.files, ...manifest.directories.flatMap((d) => walk(tpl, d))])]
    .filter((f) => f !== "rnz/brand-lock.json")
    .sort();

const missing = files.filter((f) => !existsSync(join(tpl, f)));
if (missing.length) {
    console.error(`Brand-managed files listed in the manifest are missing (renamed?):\n  ${missing.join("\n  ")}`);
    process.exit(1);
}

const lockPath = join(tpl, "rnz", "brand-lock.json");
const next = { templateVersion: manifest.templateVersion, files: {} };
for (const f of files) next.files[f] = brandHash(join(tpl, f));

if (verify) {
    const cur = existsSync(lockPath) ? JSON.parse(readFileSync(lockPath, "utf8")) : { files: {} };
    const stale = files.filter((f) => cur.files?.[f] !== next.files[f]);
    const extra = Object.keys(cur.files ?? {}).filter((f) => !next.files[f]);
    if (stale.length || extra.length || cur.templateVersion !== manifest.templateVersion) {
        console.error("brand-lock.json is out of date. Run `node scripts/rnz-lock.mjs` and commit the result.");
        for (const f of [...stale, ...extra]) console.error(`  ${f}`);
        process.exit(1);
    }
    console.log(`brand-lock.json is current (${files.length} files, template ${manifest.templateVersion}).`);
} else {
    next.syncedAt = new Date().toISOString();
    writeFileSync(lockPath, JSON.stringify(next, null, 2) + "\n");
    console.log(`Wrote brand-lock.json (${files.length} files, template ${manifest.templateVersion}).`);
}
