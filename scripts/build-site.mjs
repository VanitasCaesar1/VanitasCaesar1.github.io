// Builds the Next.js site in web/ and copies the static export to the repo root, where
// GitHub Pages serves it (Pages: main, /). Files it copied last time are listed in
// .site-manifest and removed first, so nothing stale is left behind.
// Usage: node scripts/build-site.mjs [--no-build]
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const web = join(root, "web");
const out = join(web, "out");
const manifest = join(root, ".site-manifest");

if (!process.argv.includes("--no-build")) execFileSync("npx", ["next", "build"], { cwd: web, stdio: "inherit" });
if (!existsSync(join(out, "index.html"))) throw new Error("web/out/index.html missing: did the build run?");

if (existsSync(manifest)) {
  for (const f of readFileSync(manifest, "utf8").split("\n").filter(Boolean)) {
    if (f.startsWith("web/") || f.startsWith("scripts/") || f.startsWith(".git")) continue;
    rmSync(join(root, f), { force: true, recursive: true });
  }
}
const files = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else files.push(relative(out, p));
  }
};
walk(out);
for (const top of new Set(files.map((f) => f.split("/")[0]))) cpSync(join(out, top), join(root, top), { recursive: true });
writeFileSync(manifest, files.sort().join("\n") + "\n");
console.log(`site: copied ${files.length} files from web/out to the repo root`);
