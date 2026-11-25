// Writes the last year of GitHub contributions into web/lib/contributions.json for the homepage graph.
// Usage: node scripts/update-contributions.mjs   (needs the gh CLI, signed in)
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const query = `{user(login:"VanitasCaesar1"){contributionsCollection{contributionCalendar{totalContributions weeks{contributionDays{date contributionCount}}}}}}`;
const out = JSON.parse(execFileSync("gh", ["api", "graphql", "-f", `query=${query}`], { encoding: "utf8" }));
const cal = out.data.user.contributionsCollection.contributionCalendar;
const days = cal.weeks.flatMap((w) => w.contributionDays);
const data = { total: cal.totalContributions, start: days[0].date, counts: days.map((d) => d.contributionCount) };
writeFileSync("web/lib/contributions.json", JSON.stringify(data) + "\n");
console.log(`contributions: ${data.total} over ${days.length} days from ${data.start}`);
