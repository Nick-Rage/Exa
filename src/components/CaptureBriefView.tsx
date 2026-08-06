"use client";

import { useState } from "react";
import { buildBriefMarkdown } from "@/lib/briefExport";
import type {
  BriefQuestion,
  CaptureBrief,
  DecisionAction,
  EvidenceSource,
  HumanDecision,
  MonitorSubscription,
  NoticeSnapshot,
  Pursuit,
  PursuitUpdate,
  RunStats,
  TraceEvent,
} from "@/lib/types";
import AskPanel from "./AskPanel";
import LiveActivityRail from "./LiveActivityRail";

const READINESS_CLASS = {
  ready: "text-good",
  review: "text-warn",
  blocked: "text-halt",
} as const;

const DECISION_COPY: Record<
  HumanDecision,
  { title: string; body: string; cta?: string }
> = {
  pursue: {
    title: "Pursue packet in motion",
    body: "Watch started, handoff assembled, live Exa change check running.",
    cta: "Open live monitoring",
  },
  hold: {
    title: "Hold disposition recorded",
    body: "Unresolved gates pinned; Exa keeps watching for an amendment that reopens the case.",
  },
  pass: {
    title: "Pass disposition filed",
    body: "No-bid memo drafted from blocking evidence — capture hours protected.",
  },
};

export default function CaptureBriefView({
  snapshot,
  brief,
  sources,
  trace,
  stats,
  decision,
  decisionActions,
  questions,
  monitor,
  updates,
  pursuits,
  onSelectPursuit,
  onDecision,
  onQuestion,
  onDeepen,
  onWatch,
  onOpenMonitoring,
}: {
  snapshot: NoticeSnapshot;
  brief: CaptureBrief;
  sources: EvidenceSource[];
  trace: TraceEvent[];
  stats: RunStats | null;
  decision: HumanDecision | null;
  decisionActions: DecisionAction[];
  questions: BriefQuestion[];
  monitor: MonitorSubscription | null;
  updates: PursuitUpdate[];
  pursuits: Pursuit[];
  onSelectPursuit: (pursuit: Pursuit) => void;
  onDecision: (decision: HumanDecision) => void;
  onQuestion: (question: BriefQuestion) => void;
  onDeepen: (question: string) => void;
  onWatch: () => void;
  onOpenMonitoring: () => void;
}) {
  const [showDetail, setShowDetail] = useState(false);
  const [showAsk, setShowAsk] = useState(false);
  const [copied, setCopied] = useState(false);
  const sourceMap = new Map(sources.map((source) => [source.id, source]));
  const cases = pursuits;
  const priorityGates = brief.gates
    .filter(
      (gate) =>
        gate.hardGate && (gate.state === "fail" || gate.state === "unclear"),
    )
    .concat(
      brief.gates.filter(
        (gate) =>
          !(
            gate.hardGate &&
            (gate.state === "fail" || gate.state === "unclear")
          ),
      ),
    )
    .slice(0, 3);
  const officialSources = sources
    .filter((source) => source.authority !== "secondary")
    .slice(0, 4);

  const copyBrief = async () => {
    const markdown = buildBriefMarkdown({
      snapshot,
      brief,
      decision,
      decisionActions,
    });
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="grid min-h-0 flex-1 lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="hidden border-r border-line bg-raised lg:block">
        <header className="border-b border-line p-3">
          <p className="text-xs font-semibold text-ink">Cases</p>
        </header>
        <div className="divide-y divide-line">
          {cases.map((pursuit) => (
            <button
              key={pursuit.id}
              onClick={() => onSelectPursuit(pursuit)}
              className={`block w-full px-3 py-3 text-left hover:bg-surface ${
                pursuit.snapshot.sourceUrl === snapshot.sourceUrl
                  ? "border-l-2 border-accent bg-accentsoft"
                  : ""
              }`}
            >
              <p className="line-clamp-2 text-xs font-semibold text-ink">
                {pursuit.name}
              </p>
              <p className="mt-1 text-[10px] capitalize text-inksoft">
                {pursuit.brief?.readiness ?? "researching"}
              </p>
            </button>
          ))}
        </div>
      </aside>

      <main className="scroll-quiet min-w-0 overflow-y-auto bg-paper">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <header className="rounded-xl border border-line bg-raised px-5 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`text-xs font-semibold uppercase ${READINESS_CLASS[brief.readiness]}`}
                  >
                    {brief.readiness}
                  </span>
                  <span className="font-mono text-[10px] text-inkfaint">
                    {snapshot.solicitationNumber.value ??
                      "Solicitation not stated"}
                  </span>
                </div>
                <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink">
                  {snapshot.title.value}
                </h1>
                <p className="mt-1 text-sm text-inksoft">
                  {snapshot.agency.value ?? "Agency not stated"} ·{" "}
                  {snapshot.responseDeadline.value ?? "Deadline not stated"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => void copyBrief()}
                  className="rounded-md border border-line px-3 py-1.5 text-xs font-semibold text-inksoft"
                >
                  {copied ? "Copied" : "Copy brief"}
                </button>
                <button
                  onClick={onWatch}
                  disabled={Boolean(monitor)}
                  className="rounded-md border border-line px-3 py-1.5 text-xs font-semibold text-ink disabled:text-inkfaint"
                >
                  {monitor ? "Watching" : "Watch"}
                </button>
                <div className="flex overflow-hidden rounded-md border border-line">
                  {(["pursue", "hold", "pass"] as HumanDecision[]).map(
                    (value, index) => (
                      <button
                        key={value}
                        onClick={() => onDecision(value)}
                        className={`px-3 py-1.5 text-xs font-semibold capitalize ${
                          index > 0 ? "border-l border-line" : ""
                        } ${
                          decision === value
                            ? "bg-accent text-white"
                            : "bg-raised text-inksoft"
                        }`}
                      >
                        {value}
                      </button>
                    ),
                  )}
                </div>
              </div>
            </div>
          </header>

          {decision ? (
            <section className="mt-3 overflow-hidden rounded-xl border border-accent/30 bg-raised">
              <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-accentsoft/50 px-5 py-4">
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {DECISION_COPY[decision].title}
                  </p>
                  <p className="mt-1 text-sm text-inksoft">
                    {DECISION_COPY[decision].body}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => void copyBrief()}
                    className="rounded-md border border-line bg-raised px-3 py-1.5 text-xs font-semibold text-ink"
                  >
                    {copied ? "Copied" : "Copy packet"}
                  </button>
                  {DECISION_COPY[decision].cta && (
                    <button
                      onClick={onOpenMonitoring}
                      className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      {DECISION_COPY[decision].cta}
                    </button>
                  )}
                </div>
              </header>
              <div className="divide-y divide-line">
                {decisionActions.map((action) => (
                  <div
                    key={action.id}
                    className="grid gap-2 px-5 py-3 md:grid-cols-[88px_1fr]"
                  >
                    <p
                      className={`text-xs font-semibold uppercase ${
                        action.status === "running"
                          ? "text-accent"
                          : "text-good"
                      }`}
                    >
                      {action.status === "running" ? "Working" : "Done"}
                    </p>
                    <div>
                      <p className="text-sm font-semibold text-ink">
                        {action.title}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-inksoft">
                        {action.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : (
            <section className="mt-3 overflow-hidden rounded-xl border border-line bg-raised">
              {brief.readiness === "blocked" ? (
                <div className="border-b border-halt/20 bg-haltsoft/50 px-5 py-4">
                  <p className="text-sm font-semibold text-halt">
                    Why readiness is blocked
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-ink">
                    {brief.readinessReason}. Exa verified the official notice is
                    not actionable — that saves capture hours. Pass files the
                    disposition; Hold/Pursue can still arm a follow-on watch.
                  </p>
                </div>
              ) : (
                <div className="border-b border-line px-5 py-4">
                  <p className="text-sm font-semibold text-ink">Position</p>
                  <p className="mt-2 text-sm leading-relaxed text-inksoft">
                    {brief.readinessReason}. {brief.executiveSummary}
                  </p>
                </div>
              )}

              <div className="grid gap-0 divide-y divide-line md:grid-cols-3 md:divide-x md:divide-y-0">
                {priorityGates.map((gate) => (
                  <div key={gate.id} className="px-5 py-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-inkfaint">
                      {gate.label}
                    </p>
                    <p
                      className={`mt-1 text-sm font-semibold capitalize ${
                        gate.state === "fail"
                          ? "text-halt"
                          : gate.state === "unclear"
                            ? "text-warn"
                            : "text-good"
                      }`}
                    >
                      {gate.state}
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-inksoft">
                      {gate.explanation}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2 border-t border-line px-5 py-3">
                <p className="mr-1 text-[11px] font-semibold text-inkfaint">
                  Official evidence
                </p>
                {officialSources.map((source) => (
                  <a
                    key={source.id}
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    title={source.title}
                    className="rounded-md border border-line bg-surface px-2.5 py-1 font-mono text-[10px] text-accent hover:border-accent/30"
                  >
                    {source.domain}
                  </a>
                ))}
              </div>
            </section>
          )}

          {!decision && (
            <section className="mt-3 grid gap-3 md:grid-cols-2">
              <article className="rounded-xl border border-line bg-raised px-5 py-4">
                <p className="text-xs font-semibold text-good">
                  {brief.readiness === "blocked"
                    ? "What looked promising"
                    : "Reasons to advance"}
                </p>
                <ol className="mt-3 space-y-2">
                  {brief.strongestReasons.slice(0, 2).map((reason, index) => (
                    <li
                      key={reason}
                      className="text-sm leading-relaxed text-ink"
                    >
                      <span className="mr-2 font-mono text-[10px] text-inkfaint">
                        {index + 1}.
                      </span>
                      {reason}
                    </li>
                  ))}
                </ol>
              </article>
              <article className="rounded-xl border border-line bg-raised px-5 py-4">
                <p className="text-xs font-semibold text-halt">Largest risks</p>
                <ol className="mt-3 space-y-2">
                  {brief.largestRisks.slice(0, 2).map((risk, index) => (
                    <li key={risk} className="text-sm leading-relaxed text-ink">
                      <span className="mr-2 font-mono text-[10px] text-inkfaint">
                        {index + 1}.
                      </span>
                      {risk}
                    </li>
                  ))}
                </ol>
              </article>
            </section>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => setShowDetail((value) => !value)}
              className="rounded-md border border-line bg-raised px-3 py-1.5 text-xs font-semibold text-inksoft"
            >
              {showDetail ? "Hide evidence detail" : "Evidence detail"}
            </button>
            <button
              onClick={() => setShowAsk((value) => !value)}
              className="rounded-md border border-line bg-raised px-3 py-1.5 text-xs font-semibold text-inksoft"
            >
              {showAsk ? "Hide Ask" : "Ask / deepen (optional)"}
            </button>
          </div>

          {showDetail && (
            <section className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1fr)_340px]">
              <div className="space-y-3">
                <article className="overflow-hidden rounded-xl border border-line bg-raised">
                  <header className="border-b border-line px-4 py-2.5">
                    <p className="text-xs font-semibold text-ink">All gates</p>
                  </header>
                  <div className="divide-y divide-line">
                    {brief.gates.map((gate) => (
                      <div
                        key={gate.id}
                        className="grid gap-2 px-4 py-3 md:grid-cols-[150px_70px_1fr]"
                      >
                        <p className="text-xs font-semibold text-ink">
                          {gate.label}
                        </p>
                        <p className="text-xs font-semibold capitalize text-inksoft">
                          {gate.state}
                        </p>
                        <p className="text-xs leading-relaxed text-inksoft">
                          {gate.explanation}
                        </p>
                      </div>
                    ))}
                  </div>
                </article>

                {brief.sections.map((section) => (
                  <article
                    key={section.id}
                    className="overflow-hidden rounded-xl border border-line bg-raised"
                  >
                    <header className="border-b border-line px-4 py-2.5">
                      <p className="text-xs font-semibold text-ink">
                        {section.title}
                      </p>
                      <p className="mt-1 text-xs text-inksoft">
                        {section.summary}
                      </p>
                    </header>
                    <div className="divide-y divide-line">
                      {section.facts.map((fact) => (
                        <div
                          key={fact.label}
                          className="grid gap-2 px-4 py-3 md:grid-cols-[140px_70px_1fr]"
                        >
                          <p className="text-xs font-semibold text-inksoft">
                            {fact.label}
                          </p>
                          <p className="text-[10px] font-semibold capitalize text-inkfaint">
                            {fact.state}
                          </p>
                          <div>
                            <p className="text-xs leading-relaxed text-ink">
                              {fact.value}
                            </p>
                            <div className="mt-1 flex gap-2">
                              {fact.sourceIds
                                .map((id) => sourceMap.get(id))
                                .filter(
                                  (source): source is EvidenceSource =>
                                    Boolean(source),
                                )
                                .map((source) => (
                                  <a
                                    key={source.id}
                                    href={source.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-mono text-[10px] text-accent hover:underline"
                                  >
                                    {source.domain}
                                  </a>
                                ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>

              <div className="h-[520px] xl:sticky xl:top-3">
                <LiveActivityRail
                  trace={trace}
                  running={false}
                  elapsed={stats ? Math.round(stats.elapsedMs / 1000) : 0}
                  stats={stats}
                  monitor={monitor}
                  updates={updates}
                />
              </div>
            </section>
          )}

          {showAsk && (
            <div className="mt-3">
              <AskPanel
                snapshot={snapshot}
                questions={questions}
                onQuestion={onQuestion}
                onDeepen={onDeepen}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
