// Writes the commit count into the homepage, its 1997 edition and the resume. Usage: node scripts/update-commits.mjs <count>
import { readFileSync, writeFileSync } from "node:fs";

const n = Number(process.argv[2]);
if (!Number.isInteger(n) || n <= 0) throw new Error(`bad count: ${process.argv[2]}`);
const exact = n.toLocaleString("en-US");
const about = (Math.floor(n / 100) * 100).toLocaleString("en-US");

function edit(file, rules) {
  const before = readFileSync(file, "utf8");
  let after = before;
  for (const [re, to] of rules) {
    if (!re.test(after)) throw new Error(`${file}: pattern not found: ${re}`);
    after = after.replace(re, to);
  }
  if (after !== before) writeFileSync(file, after);
}

const digits = [...String(n)].map((d) => `<span>${d}</span>`).join("");
edit("index.html", [[/<b class="commits" data-target="\d+">[\d,]+<\/b>/, `<b class="commits" data-target="${n}">${exact}</b>`]]);
edit("1997/index.html", [
  [/<div class="odometer" data-target="\d+" aria-label="[\d,]+ (?:or more )?commits">\s*(?:<span>\d<\/span>)+/,
    `<div class="odometer" data-target="${n}" aria-label="${exact} commits">\n        ${digits}`],
  [/<b>[\d,]+\+?<\/b><span>commits since March 2025<\/span>/, `<b>${exact}</b><span>commits since March 2025</span>`],
]);
edit("resume.html", [[/about [\d,]+ commits since March 2025/, `about ${about} commits since March 2025`]]);
console.log(`commit counter: ${exact}`);
