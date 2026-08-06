"use client";

import type { NoticeSnapshot } from "@/lib/types";

function Field({
  label,
  value,
  state,
}: {
  label: string;
  value: string | null;
  state: "verified" | "inference" | "unknown";
}) {
  return (
    <div className="border-b border-line py-3 last:border-0">
      <dt className="text-[11px] font-medium text-inkfaint">{label}</dt>
      <dd className="mt-1 flex items-start justify-between gap-3 text-sm text-ink">
        <span>{value ?? "Not stated"}</span>
        <span
          className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${
            state === "verified"
              ? "bg-good"
              : state === "inference"
                ? "bg-warn"
                : "bg-inkfaint/40"
          }`}
          title={state}
        />
      </dd>
    </div>
  );
}

export default function IntakeStage({
  snapshot,
  loading,
  error,
  onBack,
  onResearch,
}: {
  snapshot: NoticeSnapshot;
  loading: boolean;
  error: string | null;
  onBack: () => void;
  onResearch: () => void;
}) {
  const fields = [
    ["Agency", snapshot.agency],
    ["Contracting office", snapshot.office],
    ["Solicitation", snapshot.solicitationNumber],
    ["Notice type", snapshot.noticeType],
    ["Deadline", snapshot.responseDeadline],
    ["NAICS", snapshot.naics],
    ["PSC", snapshot.psc],
    ["Set-aside", snapshot.setAside],
    ["Contract vehicle", snapshot.contractVehicle],
    ["Period of performance", snapshot.periodOfPerformance],
  ] as const;

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-7">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <button
            onClick={onBack}
            className="text-xs font-semibold text-inksoft hover:text-ink"
          >
            ← Home
          </button>
          <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.18em] text-inkfaint">
            Live notice intake · Exa Contents
          </p>
          <h1 className="mt-2 max-w-3xl font-display text-3xl font-semibold leading-tight tracking-tight text-ink">
            {snapshot.title.value ?? "Federal opportunity"}
          </h1>
        </div>
        <button
          onClick={onResearch}
          disabled={loading}
          className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(47,107,255,0.28)] disabled:opacity-40"
        >
          Build capture brief
        </button>
      </header>

      {error && (
        <p
          className={`mt-4 rounded-xl border px-4 py-2.5 text-xs ${
            /fallback|failed|captured/i.test(error)
              ? "border-warn/25 bg-warnsoft text-ink"
              : "border-halt/20 bg-haltsoft text-halt"
          }`}
        >
          {/fallback/i.test(error) ? (
            <>
              <span className="font-semibold text-warn">
                Used Exa Search fallback.{" "}
              </span>
              {error}
            </>
          ) : (
            error
          )}
        </p>
      )}

      <div className="mt-7 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="overflow-hidden rounded-2xl border border-line bg-raised">
          <header className="flex items-center justify-between border-b border-line px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-ink">Official notice</p>
              <a
                href={snapshot.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-0.5 block truncate font-mono text-[10px] text-accent hover:underline"
              >
                {snapshot.sourceUrl}
              </a>
            </div>
            <span className="rounded-md bg-goodsoft px-2 py-1 text-[10px] font-semibold text-good">
              Live fetched
            </span>
          </header>
          <div className="scroll-quiet max-h-[590px] overflow-y-auto p-5">
            {snapshot.highlights.length > 0 && (
              <div className="mb-5 space-y-2">
                {snapshot.highlights.slice(0, 5).map((highlight) => (
                  <blockquote
                    key={highlight}
                    className="border-l-2 border-accent pl-3 text-sm leading-relaxed text-inksoft"
                  >
                    {highlight}
                  </blockquote>
                ))}
              </div>
            )}
            <pre className="whitespace-pre-wrap font-body text-xs leading-relaxed text-inksoft">
              {snapshot.rawText || "Notice text unavailable. Open the source."}
            </pre>
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-raised px-5 py-2">
          <div className="flex items-center justify-between border-b border-line py-3">
            <p className="text-sm font-semibold text-ink">
              Opportunity snapshot
            </p>
            <p className="font-mono text-[10px] text-inkfaint">
              {new Date(snapshot.fetchedAt).toLocaleTimeString()}
            </p>
          </div>
          <dl>
            {fields.map(([label, field]) => (
              <Field
                key={label}
                label={label}
                value={field.value}
                state={field.state}
              />
            ))}
          </dl>
          <p className="my-4 rounded-xl bg-surface px-3.5 py-3 text-xs leading-relaxed text-inksoft">
            Gray fields are explicitly unknown. CaptureBrief will research
            context but will not silently convert an unknown into a fact.
          </p>
        </section>
      </div>
    </div>
  );
}
