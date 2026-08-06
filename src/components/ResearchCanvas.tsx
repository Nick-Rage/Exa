"use client";

import type {
  ResearchWorkstream,
  RunStats,
  TraceEvent,
} from "@/lib/types";
import LiveActivityRail from "./LiveActivityRail";

const STATUS_LABEL: Record<ResearchWorkstream["status"], string> = {
  pending: "Queued",
  active: "Active",
  complete: "Done",
  failed: "Failed",
};

const STATUS_CLASS: Record<ResearchWorkstream["status"], string> = {
  pending: "text-inkfaint",
  active: "text-accent",
  complete: "text-good",
  failed: "text-halt",
};

const EXA_HIGHLIGHTS = [
  {
    api: "exa.getContents",
    label: "Notice retrieved",
    detail: "Official SAM.gov fields extracted before research spend.",
  },
  {
    api: "exa.search ×3",
    label: "Context gathered",
    detail: "Strategy, budget, and acquisition searches on official .gov domains.",
  },
  {
    api: "exa.agent.runs",
    label: "Brief synthesized",
    detail: "Schema-constrained gates, citations, and unknowns — human decides.",
  },
];

export default function ResearchCanvas({
  workstreams,
  trace,
  running,
  elapsed,
  stats,
  onCancel,
  onOpen,
}: {
  workstreams: ResearchWorkstream[];
  trace: TraceEvent[];
  running: boolean;
  elapsed: number;
  stats: RunStats | null;
  onCancel: () => void;
  onOpen: () => void;
}) {
  const completed = workstreams.filter(
    (workstream) => workstream.status === "complete",
  ).length;
  const progress =
    workstreams.length > 0
      ? Math.round((completed / workstreams.length) * 100)
      : 0;
  const done = !running && Boolean(stats || completed === workstreams.length);

  return (
    <div className="min-h-full bg-paper">
      <header className="border-b border-line bg-raised px-5 py-4">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-inkfaint">
              CaptureBrief · Research run
            </p>
            <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-ink">
              {done ? "Research complete" : "Building the pursuit brief"}
            </h1>
          </div>
          {running ? (
            <button
              onClick={onCancel}
              className="rounded-lg border border-line bg-surface px-4 py-2 text-xs font-semibold text-ink"
            >
              Stop research
            </button>
          ) : (
            <button
              onClick={onOpen}
              className="rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white"
            >
              Open capture case
            </button>
          )}
        </div>
      </header>

      {done && (
        <section className="border-b border-line bg-accentsoft/40 px-5 py-4">
          <div className="mx-auto max-w-7xl">
            <p className="text-xs font-semibold text-ink">
              Linger here — narrate what Exa just did
            </p>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              {EXA_HIGHLIGHTS.map((item) => (
                <div
                  key={item.api}
                  className="rounded-xl border border-line bg-raised px-3.5 py-3"
                >
                  <p className="font-mono text-[10px] text-accent">{item.api}</p>
                  <p className="mt-1 text-sm font-semibold text-ink">
                    {item.label}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-inksoft">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <main className="mx-auto grid max-w-7xl gap-5 px-5 py-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <section className="rounded-2xl border border-line bg-raised p-5">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-inkfaint">
                Research workstreams
              </p>
              <p className="mt-2 text-sm text-inksoft">
                Official notice, agency context, funding, acquisition history,
                then synthesis.
              </p>
            </div>
            <p className="font-mono text-xs tabular-nums text-inksoft">
              {completed}/{workstreams.length || 5}
            </p>
          </div>

          <div className="mt-4 h-1 overflow-hidden rounded-full bg-line">
            <div
              className="h-full bg-accent transition-[width] duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          <ol className="mt-5 divide-y divide-line">
            {workstreams.map((workstream, index) => (
              <li
                key={workstream.id}
                className="grid grid-cols-[32px_1fr_auto] items-start gap-3 py-4"
              >
                <span className="font-mono text-xs text-inkfaint">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {workstream.label}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-inksoft">
                    {workstream.detail}
                  </p>
                  {workstream.sourceCount > 0 && (
                    <p className="mt-1 font-mono text-[10px] text-inkfaint">
                      {workstream.sourceCount} source
                      {workstream.sourceCount === 1 ? "" : "s"}
                    </p>
                  )}
                  {workstream.status === "active" && (
                    <div className="mt-3 h-px overflow-hidden bg-line">
                      <div className="sweep-line h-full w-1/3 bg-accent" />
                    </div>
                  )}
                </div>
                <span
                  className={`text-[10px] font-semibold uppercase tracking-wide ${STATUS_CLASS[workstream.status]}`}
                >
                  {STATUS_LABEL[workstream.status]}
                </span>
              </li>
            ))}
          </ol>
        </section>

        <div className="h-[590px]">
          <LiveActivityRail
            trace={trace}
            running={running}
            elapsed={elapsed}
            stats={stats}
          />
        </div>
      </main>
    </div>
  );
}
