"use client";

import { useMemo, useState } from "react";
import type { Pursuit } from "@/lib/types";

export function derivePortfolioMetrics(pursuits: Pursuit[]) {
  return {
    pursuits: pursuits.length,
    needsDeadline: pursuits.filter(
      (pursuit) => !pursuit.snapshot.responseDeadline.value,
    ).length,
    needsReview: pursuits.filter(
      (pursuit) =>
        pursuit.brief?.readiness === "review" ||
        pursuit.brief?.readiness === "blocked",
    ).length,
    watched: pursuits.filter((pursuit) => Boolean(pursuit.monitor)).length,
    changes: pursuits.reduce(
      (count, pursuit) =>
        count + pursuit.updates.filter((update) => !update.read).length,
      0,
    ),
    spend: pursuits.reduce(
      (total, pursuit) => total + (pursuit.stats?.costTotal ?? 0),
      0,
    ),
  };
}

export default function OperationsDashboard({
  pursuits,
  liveReady,
  intakeLoading,
  intakeError,
  onOpen,
  onIntake,
}: {
  pursuits: Pursuit[];
  liveReady: boolean;
  intakeLoading: boolean;
  intakeError: string | null;
  onOpen: (pursuit: Pursuit) => void;
  onIntake: (url: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [readiness, setReadiness] = useState("all");
  const [showIntake, setShowIntake] = useState(false);
  const [url, setUrl] = useState("");
  const metrics = derivePortfolioMetrics(pursuits);
  const filtered = useMemo(
    () =>
      pursuits.filter((pursuit) => {
        const haystack =
          `${pursuit.name} ${pursuit.snapshot.agency.value ?? ""} ${pursuit.snapshot.solicitationNumber.value ?? ""}`.toLowerCase();
        return (
          haystack.includes(query.toLowerCase()) &&
          (readiness === "all" ||
            pursuit.brief?.readiness === readiness)
        );
      }),
    [pursuits, query, readiness],
  );

  const metricRows = [
    ["Active pursuits", metrics.pursuits.toString(), "Portfolio"],
    ["Deadline unknown", metrics.needsDeadline.toString(), "Needs confirmation"],
    ["Gate attention", metrics.needsReview.toString(), "Review or blocked"],
    ["Watched", metrics.watched.toString(), "Exa Monitors"],
    ["Unread changes", metrics.changes.toString(), "Material signals"],
    ["Research spend", `$${metrics.spend.toFixed(3)}`, "Recorded runs"],
  ];
  const metricAccent = [
    "bg-accent",
    "bg-warn",
    "bg-halt",
    "bg-good",
    "bg-accent",
    "bg-inksoft",
  ];
  const alerts = pursuits.flatMap((pursuit) => {
    const rows: Array<{ label: string; detail: string; pursuit: Pursuit }> = [];
    if (!pursuit.snapshot.responseDeadline.value) {
      rows.push({
        label: "Deadline not verified",
        detail: pursuit.name,
        pursuit,
      });
    }
    pursuit.brief?.gates
      .filter(
        (gate) =>
          gate.hardGate && (gate.state === "unclear" || gate.state === "fail"),
      )
      .forEach((gate) =>
        rows.push({
          label: `${gate.label}: ${gate.state}`,
          detail: gate.explanation,
          pursuit,
        }),
      );
    const unread = pursuit.updates.filter((update) => !update.read);
    if (unread.length > 0) {
      rows.push({
        label: `${unread.length} unread monitored change${unread.length === 1 ? "" : "s"}`,
        detail: unread[0].title,
        pursuit,
      });
    }
    return rows;
  });

  return (
    <div className="mx-auto w-full max-w-[1500px] px-5 py-5">
      <div className="flex items-end justify-between gap-4 py-2">
        <div>
          <p className="text-[11px] font-semibold text-accent">
            Capture command center
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-[-0.025em] text-ink">
            What needs your attention
          </h1>
          <p className="mt-2 text-sm text-inksoft">
            Move active federal pursuits from notice intake to a defensible
            capture decision.
          </p>
        </div>
        <button
          onClick={() => setShowIntake((value) => !value)}
          className="rounded-md bg-accent px-3.5 py-2 text-xs font-semibold text-white"
        >
          New pursuit
        </button>
      </div>

      {showIntake && (
        <section className="mt-4 rounded-xl border border-accent/20 bg-raised p-4 shadow-[0_10px_30px_rgba(16,24,40,0.06)]">
          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <div>
              <label className="font-mono text-[9px] uppercase tracking-wide text-inkfaint">
                SAM.gov or official notice URL
              </label>
              <input
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://sam.gov/opp/…/view"
                className="mt-1.5 w-full rounded-md border border-line bg-surface px-3 py-2 text-xs text-ink outline-none focus:border-accent"
              />
            </div>
            <button
              onClick={() => onIntake(url)}
              disabled={!url.trim() || intakeLoading}
              className="self-end rounded-md bg-ink px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"
            >
              {intakeLoading ? "Fetching…" : "Review notice"}
            </button>
          </div>
          {intakeError && (
            <p className="mt-2 text-[11px] text-halt">{intakeError}</p>
          )}
        </section>
      )}

      <section className="mt-5 grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {metricRows.map(([label, value, note], index) => (
          <div
            key={label}
            className="relative overflow-hidden rounded-[14px] border border-line bg-raised px-4 py-4 shadow-[0_6px_20px_rgba(16,24,40,0.04)] transition-all hover:-translate-y-0.5 hover:border-linestrong hover:shadow-[0_10px_28px_rgba(16,24,40,0.07)]"
          >
            <span
              className={`absolute inset-x-0 top-0 h-0.5 ${metricAccent[index]}`}
            />
            <p className="text-[9px] uppercase tracking-wide text-inkfaint">
              {label}
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums text-ink">
              {value}
            </p>
            <p className="mt-1 text-[9px] text-inkfaint">{note}</p>
          </div>
        ))}
      </section>

      <section className="mt-5 overflow-hidden rounded-[16px] border border-line bg-raised shadow-[0_10px_30px_rgba(16,24,40,0.045)]">
        <header className="border-b border-line px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 text-xs font-semibold text-ink">
                <span className="h-4 w-1 rounded-full bg-warn" />
                Risk signals
              </p>
              <p className="mt-0.5 text-[10px] text-inksoft">
                Specific evidence gaps and changes requiring capture review.
              </p>
            </div>
            <span className="font-mono text-[9px] text-inkfaint">
              {liveReady ? "Exa API connected" : "Captured-run mode"}
            </span>
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-3">
            {alerts.slice(0, 6).map((alert, index) => (
              <button
                key={`${alert.pursuit.id}-${alert.label}-${index}`}
                onClick={() => onOpen(alert.pursuit)}
                className="rounded-lg border border-line bg-surface p-3 text-left hover:border-warn/30 hover:bg-warnsoft"
              >
                <p className="text-[10px] font-semibold capitalize text-ink">
                  {alert.label}
                </p>
                <p className="mt-1 line-clamp-2 text-[9px] leading-relaxed text-inksoft">
                  {alert.detail}
                </p>
              </button>
            ))}
            {alerts.length === 0 && (
              <p className="py-2 text-[10px] text-inksoft">
                No unresolved hard-gate risks or unread changes.
              </p>
            )}
          </div>
          <div className="mt-3 border-t border-line pt-3">
          <div className="mt-3 grid gap-2 md:grid-cols-[1fr_180px]">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search title, agency, or solicitation"
              className="rounded-md border border-line bg-surface px-3 py-2 text-xs outline-none focus:border-accent"
            />
            <select
              value={readiness}
              onChange={(event) => setReadiness(event.target.value)}
              className="rounded-md border border-line bg-surface px-3 py-2 text-xs text-ink"
            >
              <option value="all">All readiness states</option>
              <option value="ready">Ready</option>
              <option value="review">Review</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
          </div>
        </header>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse text-left">
            <thead className="bg-surface">
              <tr className="border-b border-line text-[9px] uppercase tracking-wide text-inkfaint">
                {[
                  "Pursuit",
                  "Agency",
                  "Deadline",
                  "Readiness",
                  "Decision",
                  "Evidence",
                  "Changes",
                  "",
                ].map((label) => (
                  <th key={label} className="px-4 py-2.5 font-medium">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((pursuit) => (
                <tr
                  key={pursuit.id}
                  className="group border-b border-line transition-colors last:border-0 hover:bg-accentsoft/40"
                >
                  <td className="max-w-[310px] px-4 py-3">
                    <p className="truncate text-xs font-semibold text-ink">
                      {pursuit.name}
                    </p>
                    <p className="mt-1 font-mono text-[9px] text-inkfaint">
                      {pursuit.snapshot.solicitationNumber.value ??
                        "Solicitation not stated"}
                    </p>
                  </td>
                  <td className="max-w-[200px] px-4 py-3 text-[10px] text-inksoft">
                    {pursuit.snapshot.agency.value ?? "Not stated"}
                  </td>
                  <td className="px-4 py-3 text-[10px] text-inksoft">
                    {pursuit.snapshot.responseDeadline.value ?? "Not stated"}
                  </td>
                  <td className="px-4 py-3 text-[10px] font-semibold capitalize">
                    <span
                      className={`rounded-full px-2 py-1 ${
                        pursuit.brief?.readiness === "ready"
                          ? "bg-goodsoft text-good"
                          : pursuit.brief?.readiness === "blocked"
                            ? "bg-haltsoft text-halt"
                            : "bg-warnsoft text-warn"
                      }`}
                    >
                      {pursuit.brief?.readiness ?? "Researching"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[10px] capitalize text-inksoft">
                    {pursuit.decision ?? "No decision"}
                  </td>
                  <td className="px-4 py-3 font-mono text-[10px] text-inksoft">
                    {pursuit.sources.length}
                  </td>
                  <td className="px-4 py-3 font-mono text-[10px] text-inksoft">
                    {pursuit.updates.filter((update) => !update.read).length}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => onOpen(pursuit)}
                      className="rounded-md border border-accent/20 bg-accentsoft px-3 py-1.5 text-[10px] font-semibold text-accent transition group-hover:bg-accent group-hover:text-white"
                    >
                      Open case
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="py-12 text-center text-xs text-inksoft">
              No pursuits match these filters.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
