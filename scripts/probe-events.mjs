/**
 * One-off: stream a small Agent run and record every event name + payload shape
 * so the UI trace is built against the real contract instead of guesses.
 */
import "dotenv/config";
import Exa from "exa-js";
import { writeFileSync } from "node:fs";

const exa = new Exa(process.env.EXA_API_KEY);

const events = await exa.agent.runs.create({
  query:
    "Find 2 currently open U.S. public-sector RFPs for identity and access management (IAM, SSO, MFA). Return title, url, buyer.",
  outputSchema: {
    type: "object",
    required: ["opportunities"],
    properties: {
      opportunities: {
        type: "array",
        maxItems: 2,
        items: {
          type: "object",
          required: ["title", "url", "buyer"],
          properties: {
            title: { type: "string" },
            url: { type: "string" },
            buyer: { type: "string" },
          },
        },
      },
    },
  },
  effort: "low",
  stream: true,
});

const log = [];
const names = new Map();

for await (const ev of events) {
  const name = ev.event ?? "(unnamed)";
  names.set(name, (names.get(name) ?? 0) + 1);
  log.push({ name, data: ev.data });
  const preview = JSON.stringify(ev.data ?? {}).slice(0, 220);
  console.log(`\n[${name}] ${preview}`);
}

console.log("\n=== EVENT NAME COUNTS ===");
for (const [name, n] of [...names].sort((a, b) => b[1] - a[1])) {
  console.log(`${n.toString().padStart(4)}  ${name}`);
}

writeFileSync("scripts/events-sample.json", JSON.stringify(log, null, 2));
console.log(`\nWrote ${log.length} events to scripts/events-sample.json`);
