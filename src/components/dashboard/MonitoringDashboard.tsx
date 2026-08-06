"use client";

import { useEffect, useMemo, useState } from "react";
import type { Pursuit } from "@/lib/types";

function relativeTime(value: string | null | undefined): string {
  if (!value) return "Waiting for first check";
  const delta = Date.now() - new Date(value).getTime();
  if (delta < 15_000) return "Just now";
  if (delta < 60_000) return `${Math.max(1, Math.round(delta / 1000))}s ago`;
  if (delta < 3_600_000) return `${Math.round(delta / 60_000)}m ago`;
  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MonitoringDashboard({
  pursuits,
  onOpen,
  onRefresh,
}: {
  pursuits: Pursuit[];
  onOpen: (pursuit: Pursuit) => void;
  onRefresh?: (pursuit: Pursuit) => void;
}) {
  const watched = pursuits.filter((pursuit) => pursuit.monitor);
  const [selectedId, setSelectedId] = useState(watched[0]?.id ?? "");
  const [, setTick] = useState(0);
  const selected =
    watched.find((pursuit) => pursuit.id === selectedId) ?? watched[0] ?? null;
  const updates = watched.flatMap((pursuit) =>
    pursuit.updates.map((update) => ({ pursuit, update })),
  );
  const authority = useMemo(() => {
    const sources = selected?.sources ?? [];
    return {
      official: sources.filter((source) => source.authority === "official")
        .length,
      authoritative: sources.filter(
        (source) => source.authority === "authoritative",
      ).length,
      secondary: sources.filter((source) => source.authority === "secondary")
        .length,
    };
  }, [selected]);
  useEffect(() => {
    if (watched[0] && !selectedId) setSelectedId(watched[0].id);
  }, [watched, selectedId]);

  useEffect(() => {
    const timer = setInterval(() => setTick((value) => value + 1), 5_000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="mx-auto w-full max-w-[1500px] px-5 py-5">
      <p className="text-[11px] font-semibold text-accent">
        Continuous intelligence
      </p>
      <h1 className="mt-1 text-3xl font-semibold tracking-[-0.025em] text-ink">
        Stay ahead of every change
      </h1>
      <p className="mt-2 text-sm text-inksoft">
        Exa rescans watched notices for amendments, deadline shifts, and
        attachment changes — with the supporting public source attached.
      </p>

      <section className="mt-5 grid gap-3 sm:grid-cols-4">
        {[
          ["Watched pursuits", watched.length],
          [
            "Unread changes",
            updates.filter(({ update }) => !update.read).length,
          ],
          [
            "Deadline changes",
            updates.filter(({ update }) => update.type === "deadline").length,
          ],
          [
            "Attachment changes",
            updates.filter(({ update }) => update.type === "attachment")
              .length,
          ],
        ].map(([label, value], index) => (
          <div
            key={label}
            className="relative overflow-hidden rounded-[14px] border border-line bg-raised px-4 py-4 shadow-[0_6px_20px_rgba(16,24,40,0.04)] transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(16,24,40,0.07)]"
          >
            <span
              className={`absolute inset-x-0 top-0 h-0.5 ${
                index === 1
                  ? "bg-warn"
                  : index === 2 || index === 3
                    ? "bg-halt"
                    : "bg-accent"
              }`}
            />
            <p className="text-[9px] uppercase tracking-wide text-inkfaint">
              {label}
            </p>
            <p className="mt-1 text-xl font-semibold text-ink">{value}</p>
          </div>
        ))}
      </section>

      <div className="mt-5 grid min-h-[560px] overflow-hidden rounded-[16px] border border-line bg-raised shadow-[0_10px_30px_rgba(16,24,40,0.045)] lg:grid-cols-[260px_minmax(0,1fr)_300px]">
        <aside className="border-b border-line lg:border-b-0 lg:border-r">
          <div className="border-b border-line px-3 py-3">
            <p className="text-xs font-semibold text-ink">Watched pursuits</p>
          </div>
          {watched.map((pursuit) => (
            <button
              key={pursuit.id}
              onClick={() => setSelectedId(pursuit.id)}
              className={`block w-full border-b border-line px-3 py-3 text-left ${
                selected?.id === pursuit.id
                  ? "bg-accentsoft"
                  : "hover:bg-surface"
              }`}
            >
              <p className="line-clamp-2 text-[11px] font-semibold text-ink">
                {pursuit.name}
              </p>
              <div className="mt-2 flex justify-between font-mono text-[9px] text-inkfaint">
                <span>
                  {pursuit.monitor?.checking
                    ? "checking"
                    : pursuit.monitor?.status === "active"
                      ? "live"
                      : pursuit.monitor?.status}
                </span>
                <span>
                  {pursuit.updates.filter((update) => !update.read).length} new
                </span>
              </div>
            </button>
          ))}
          {watched.length === 0 && (
            <p className="px-4 py-8 text-center text-xs text-inksoft">
              No watched pursuits yet. Choose Pursue or Hold, or click Watch on
              a case.
            </p>
          )}
        </aside>

        <main className="min-w-0">
          <header className="border-b border-line px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-ink">
                  Material change feed
                </p>
                <p className="mt-0.5 text-[10px] text-inksoft">
                  {selected?.monitor?.checking
                    ? "Exa is scanning SAM.gov and related federal sources…"
                    : selected?.monitor?.lastCheckedAt
                      ? `Live — last checked ${relativeTime(selected.monitor.lastCheckedAt)}`
                      : "Live monitor armed — waiting for first check"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {selected && onRefresh && (
                  <button
                    onClick={() => onRefresh(selected)}
                    className="text-[10px] font-semibold text-inksoft hover:text-accent"
                  >
                    Check now
                  </button>
                )}
                {selected && (
                  <button
                    onClick={() => onOpen(selected)}
                    className="text-[10px] font-semibold text-accent"
                  >
                    Open intelligence
                  </button>
                )}
              </div>
            </div>
          </header>
          <div className="divide-y divide-line">
            {(selected?.updates ?? []).map((update) => (
              <article key={update.id} className="px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[9px] font-semibold uppercase tracking-wide text-accent">
                    {update.type}
                  </span>
                  <time className="font-mono text-[9px] text-inkfaint">
                    {new Date(update.detectedAt).toLocaleString()}
                  </time>
                </div>
                <p className="mt-2 text-xs font-semibold text-ink">
                  {update.title}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-inksoft">
                  {update.description}
                </p>
                <a
                  href={update.source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block font-mono text-[9px] text-accent hover:underline"
                >
                  {update.source.domain}
                </a>
              </article>
            ))}
            {selected && selected.updates.length === 0 && (
              <p className="py-12 text-center text-xs text-inksoft">
                {selected.monitor?.checking
                  ? "First live check in progress…"
                  : "No material changes detected yet. Exa will keep scanning."}
              </p>
            )}
          </div>
        </main>

        <aside className="border-t border-line lg:border-l lg:border-t-0">
          <section className="border-b border-line p-4">
            <p className="text-xs font-semibold text-ink">Source governance</p>
            <dl className="mt-3 space-y-2 text-[10px]">
              {Object.entries(authority).map(([label, count]) => (
                <div key={label} className="flex justify-between">
                  <dt className="capitalize text-inksoft">{label}</dt>
                  <dd className="font-mono text-ink">{count}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section className="p-4">
            <p className="text-xs font-semibold text-ink">Audit history</p>
            <div className="mt-3 space-y-3">
              {selected?.monitor && (
                <div>
                  <p className="text-[10px] font-semibold text-ink">
                    {selected.monitor.checking
                      ? "Live check running"
                      : "Monitor live"}
                  </p>
                  <p className="font-mono text-[9px] text-inkfaint">
                    {selected.monitor.lastCheckedAt
                      ? `Checked ${relativeTime(selected.monitor.lastCheckedAt)}`
                      : "Armed for continuous scans"}
                  </p>
                </div>
              )}
              {(selected?.decisionActions ?? []).map((action) => (
                <div key={action.id}>
                  <p className="text-[10px] font-semibold text-ink">
                    {action.title}
                  </p>
                  <p className="mt-0.5 text-[9px] leading-relaxed text-inksoft">
                    {action.detail}
                  </p>
                  <p className="font-mono text-[9px] text-inkfaint">
                    {new Date(action.createdAt).toLocaleString()} ·{" "}
                    {action.status}
                  </p>
                </div>
              ))}
              {selected?.stats && (
                <div>
                  <p className="text-[10px] font-semibold text-ink">
                    Agent research completed
                  </p>
                  <p className="font-mono text-[9px] text-inkfaint">
                    {selected.stats.runId ?? "Captured run"}
                  </p>
                </div>
              )}
              {selected?.decision && (
                <div>
                  <p className="text-[10px] font-semibold capitalize text-ink">
                    Decision: {selected.decision}
                  </p>
                  <p className="font-mono text-[9px] text-inkfaint">
                    {new Date(selected.updatedAt).toLocaleString()}
                  </p>
                </div>
              )}
              {selected?.questions.map((question) => (
                <div key={question.id}>
                  <p className="line-clamp-2 text-[10px] font-semibold text-ink">
                    Asked: {question.question}
                  </p>
                  <p className="font-mono text-[9px] text-inkfaint">
                    {new Date(question.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
