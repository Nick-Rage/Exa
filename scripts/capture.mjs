/**
 * Capture one real federal notice → Search → Agent run for rehearsal.
 *
 * npm run capture
 * npm run capture -- --save
 */
import { config } from "dotenv";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(here, "../.env.local") });
config({ path: resolve(here, "../.env") });

if (!process.env.EXA_API_KEY) {
  console.error("EXA_API_KEY missing.");
  process.exit(1);
}

const { DEMO_SNAPSHOT } = await import("../src/lib/federalDemo.ts");
const { intakeNotice } = await import("../src/lib/intake.ts");
const { FEDERAL_IDENTITY_PROFILE } = await import("../src/lib/profile.ts");
const { streamCaptureResearch } = await import("../src/lib/search.ts");

const save = process.argv.includes("--save");
const startedAt = Date.now();

console.log("1/3 Fetching current federal notice with Exa Contents…");
const intake = await intakeNotice(DEMO_SNAPSHOT.sourceUrl);
console.log(`    ${intake.snapshot.title.value ?? "Notice"} · ${intake.sources.length} source`);

console.log("2/3 Searching federal strategy, budget, and acquisition evidence…");
console.log("3/3 Building structured capture brief with Exa Agent…");

const trace = [];
const workstreams = [];
let result = null;

for await (const progress of streamCaptureResearch({
  snapshot: intake.snapshot,
  profile: FEDERAL_IDENTITY_PROFILE,
  noticeSources: intake.sources,
  effort: "low",
})) {
  if (progress.type === "trace") {
    trace.push(progress.event);
    console.log(`    [${progress.event.workstream}] ${progress.event.text}`);
  }
  if (progress.type === "workstream") {
    const index = workstreams.findIndex((item) => item.id === progress.workstream.id);
    if (index < 0) workstreams.push(progress.workstream);
    else workstreams[index] = progress.workstream;
  }
  if (progress.type === "error") throw new Error(progress.message);
  if (progress.type === "done") result = progress.result;
}

if (!result) throw new Error("Research completed without a result");

const hardFailReady = result.brief.gates.some(
  (gate) => gate.hardGate && gate.state === "fail",
) && result.brief.readiness === "ready";
const majorSectionsGrounded = result.brief.sections.every(
  (section) =>
    section.facts.length === 0 ||
    section.facts.some(
      (fact) => fact.sourceIds.length > 0 || fact.state === "unknown",
    ),
);

if (hardFailReady) throw new Error("Invariant failed: ready brief has a failed hard gate");
if (!majorSectionsGrounded) {
  throw new Error("Invariant failed: a major section has no evidence or explicit unknown");
}
if (!result.sources.some((source) => source.authority === "official")) {
  throw new Error("Invariant failed: no official source");
}

console.log(
  `\n${result.brief.readiness.toUpperCase()} · ${result.sources.length} sources · ` +
    `${Math.round(result.stats.elapsedMs / 1000)}s · ` +
    `${result.stats.costTotal != null ? `$${result.stats.costTotal.toFixed(3)}` : "cost unavailable"}`,
);
console.log(result.brief.executiveSummary);
console.log("\nInvariants OK.");

if (save) {
  const out = resolve(here, "../.data/federal-golden-path.json");
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(
    out,
    JSON.stringify(
      {
        capturedAt: new Date().toISOString(),
        elapsedMs: Date.now() - startedAt,
        snapshot: intake.snapshot,
        sources: result.sources,
        workstreams,
        trace,
        brief: result.brief,
        stats: result.stats,
      },
      null,
      2,
    ),
    { encoding: "utf8", mode: 0o600 },
  );
  console.log(`Saved ${out}`);
}
