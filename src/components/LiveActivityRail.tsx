"use client";

import { useEffect, useRef } from "react";
import type {
  MonitorSubscription,
  PursuitUpdate,
  RunStats,
  TraceEvent,
} from "@/lib/types";

const WORKSTREAM_LABEL: Record<TraceEvent["workstream"], string> = {
  notice: "Notice",
  strategy: "Strategy",
  budget: "Budget",
  acquisition: "Acquisition",
  synthesis: "Synthesis",
};

const EVENT_VERB: Record<TraceEvent["kind"], string> = {
  status: "Working",
  search: "Searching",
  fetch: "Fetching",
  source: "Opened",
  done: "Complete",
};

function elapsedLabel(milliseconds: number): string {
  return `+${(milliseconds / 1000).toFixed(1)}s`;
}

export default function LiveActivityRail({
  trace,
  running,
  elapsed,
  stats,
  monitor,
  updates,
  compact = false,
}: {
  trace: TraceEvent[];
  running: boolean;
  elapsed: number;
  stats: RunStats | null;
  monitor?: MonitorSubscription | null;
  updates?: PursuitUpdate[];
  compact?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const watchedUpdates = updates ?? [];
  const showChanges = Boolean(monitor);
  const liveSources = new Set(
    trace.filter((event) => event.kind === "source").map((event) => event.url),
  ).size;
  const liveSearches = trace.filter(
    (event) => event.kind === "search",
  ).length;

  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [trace.length, watchedUpdates.length]);

  return (
    <aside
      className={`flex min-h-0 flex-col border-line bg-raised ${
        compact ? "h-full" : "overflow-hidden rounded-2xl border"
      }`}
    >
      <header className="border-b border-line px-4 py-3.5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-ink">
              {showChanges ? "Live monitor" : "Research activity"}
            </p>
            <p className="mt-0.5 text-[11px] text-inksoft">
              {showChanges
                ? monitor?.checking
                  ? "Exa scanning for material changes…"
                  : monitor?.lastCheckedAt
                    ? `Last checked ${new Date(monitor.lastCheckedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                    : "Armed for continuous scans"
                : running
                  ? "Events received from Exa"
                  : "Recorded research trail"}
            </p>
          </div>
          <span className="font-mono text-[10px] tabular-nums text-inkfaint">
            {running ? `${elapsed}s elapsed` : "Run complete"}
          </span>
        </div>
      </header>

      <div
        ref={scrollRef}
        className="scroll-quiet min-h-0 flex-1 overflow-y-auto px-4 py-3"
      >
        {showChanges ? (
          <ol className="space-y-4">
            {watchedUpdates.length === 0 && (
              <li className="py-8 text-center text-xs text-inkfaint">
                {monitor?.checking
                  ? "First live check in progress…"
                  : "No material changes yet — Exa is watching."}
              </li>
            )}
            {watchedUpdates
              .slice()
              .reverse()
              .map((update) => (
                <li key={update.id} className="border-l-2 border-accent pl-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-accent">
                      {update.type}
                    </span>
                    <time className="font-mono text-[9px] text-inkfaint">
                      {new Date(update.detectedAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </time>
                  </div>
                  <p className="mt-1 text-xs font-semibold leading-snug text-ink">
                    {update.title}
                  </p>
                  <p className="mt-1 line-clamp-3 text-[11px] leading-relaxed text-inksoft">
                    {update.description}
                  </p>
                  <a
                    href={update.source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1.5 block truncate font-mono text-[9px] text-accent hover:underline"
                  >
                    {update.source.domain}
                  </a>
                </li>
              ))}
          </ol>
        ) : (
          <ol className="space-y-1">
            {trace.length === 0 && (
              <li className="py-8 text-center text-xs text-inkfaint">
                Research events will appear here.
              </li>
            )}
            {trace.map((event) => (
              <li
                key={event.id}
                className="grid grid-cols-[42px_1fr] gap-2 border-b border-line/70 py-2.5 last:border-0"
              >
                <time className="pt-0.5 font-mono text-[9px] tabular-nums text-inkfaint">
                  {elapsedLabel(event.at)}
                </time>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-[9px] font-semibold uppercase tracking-wide text-inkfaint">
                      {WORKSTREAM_LABEL[event.workstream]}
                    </span>
                    <span className="text-[10px] font-semibold text-inksoft">
                      {EVENT_VERB[event.kind]}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-snug text-ink">
                    {event.text}
                  </p>
                  {event.domain && (
                    <a
                      href={event.url ?? "#"}
                      target={event.url ? "_blank" : undefined}
                      rel={event.url ? "noreferrer" : undefined}
                      className="mt-1 block truncate font-mono text-[9px] text-accent hover:underline"
                    >
                      {event.domain}
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      <footer className="grid grid-cols-3 border-t border-line bg-surface">
        {[
          ["Sources", stats?.sourcesSeen ?? liveSources],
          ["Searches", stats?.searches ?? liveSearches],
          [
            "Cost",
            stats?.costTotal != null ? `$${stats.costTotal.toFixed(3)}` : "—",
          ],
        ].map(([label, value], index) => (
          <div
            key={label}
            className={`px-3 py-3 ${index > 0 ? "border-l border-line" : ""}`}
          >
            <p className="font-mono text-[8px] uppercase tracking-wide text-inkfaint">
              {label}
            </p>
            <p className="mt-1 text-sm font-semibold tabular-nums text-ink">
              {value}
            </p>
          </div>
        ))}
      </footer>
    </aside>
  );
}
