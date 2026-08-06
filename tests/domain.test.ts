import assert from "node:assert/strict";
import test from "node:test";
import {
  DEMO_BRIEF,
  DEMO_PURSUIT,
  DEMO_UPDATE,
} from "../src/lib/federalDemo";
import { isAllowedNoticeUrl } from "../src/lib/intake";
import {
  classifyAuthority,
  deriveReadiness,
} from "../src/lib/normalize";
import {
  deduplicateUpdates,
  signMonitorPayload,
  verifyMonitorSignature,
} from "../src/lib/monitor";
import { derivePortfolioMetrics } from "../src/components/dashboard/OperationsDashboard";

test("source authority recognizes official federal domains", () => {
  assert.equal(classifyAuthority("https://sam.gov/opp/123"), "official");
  assert.equal(classifyAuthority("https://www.cisa.gov/zero-trust"), "official");
  assert.equal(classifyAuthority("https://example.com/post"), "secondary");
});

test("notice intake rejects non-federal and unsafe URLs", () => {
  assert.equal(isAllowedNoticeUrl("https://sam.gov/opp/123"), true);
  assert.equal(isAllowedNoticeUrl("https://agency.gov/notices/123"), true);
  assert.equal(isAllowedNoticeUrl("http://sam.gov/opp/123"), false);
  assert.equal(isAllowedNoticeUrl("https://sam.gov.example.com/opp"), false);
});

test("failed hard gate always blocks readiness", () => {
  const gates = DEMO_BRIEF.gates.map((gate) =>
    gate.id === "scope" ? { ...gate, state: "fail" as const } : gate,
  );
  assert.equal(deriveReadiness(gates).readiness, "blocked");
});

test("unclear hard gate requires review", () => {
  const gates = DEMO_BRIEF.gates.map((gate) =>
    gate.state === "fail" ? { ...gate, state: "pass" as const } : gate,
  );
  assert.equal(deriveReadiness(gates).readiness, "review");
});

test("monitor signature verification is constant-shape and exact", () => {
  const body = '{"event":"monitor.run.completed"}';
  const timestamp = "1785916800";
  const secret = "whsec_capturebrief";
  const signature = signMonitorPayload(body, timestamp, secret);
  assert.equal(
    verifyMonitorSignature(
      body,
      `t=${timestamp},v1=${signature}`,
      secret,
    ),
    true,
  );
  assert.equal(
    verifyMonitorSignature(`${body} `, `t=${timestamp},v1=${signature}`, secret),
    false,
  );
});

test("monitor updates are deduplicated by field event and source", () => {
  assert.equal(
    deduplicateUpdates([DEMO_UPDATE], [DEMO_UPDATE]).length,
    0,
  );
});

test("captured golden path satisfies trust invariants", () => {
  assert.ok(
    DEMO_PURSUIT.sources.some((source) => source.authority === "official"),
  );
  assert.ok(
    DEMO_PURSUIT.brief?.sections.every((section) =>
      section.facts.every(
        (fact) => fact.state === "unknown" || fact.sourceIds.length > 0,
      ),
    ),
  );
  assert.notEqual(
    DEMO_PURSUIT.brief?.gates.some(
      (gate) => gate.hardGate && gate.state === "fail",
    ) && DEMO_PURSUIT.brief?.readiness === "ready",
    true,
  );
});

test("portfolio metrics are derived from pursuit records", () => {
  const metrics = derivePortfolioMetrics([DEMO_PURSUIT]);
  assert.equal(metrics.pursuits, 1);
  assert.equal(metrics.needsDeadline, 1);
  assert.equal(metrics.needsReview, 1);
  assert.equal(metrics.watched, 0);
  assert.equal(metrics.changes, 0);
  assert.equal(metrics.spend, DEMO_PURSUIT.stats?.costTotal);
});
