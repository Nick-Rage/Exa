"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildDecisionActions } from "@/lib/decisionActions";
import { FEDERAL_IDENTITY_PROFILE } from "@/lib/profile";
import {
  DEMO_PURSUIT,
  DEMO_SNAPSHOT,
} from "@/lib/federalDemo";
import type {
  BriefQuestion,
  DecisionAction,
  Effort,
  EvidenceSource,
  HumanDecision,
  MonitorSubscription,
  NoticeSnapshot,
  Pursuit,
  PursuitUpdate,
} from "@/lib/types";
import { DEMO_EXAMPLES } from "@/lib/demoGuide";
import IntakeStage from "./IntakeStage";
import ResearchCanvas from "./ResearchCanvas";
import ResearchReplay from "./ResearchReplay";
import CaptureBriefView from "./CaptureBriefView";
import DemoGuide from "./DemoGuide";
import StageStrip, { type DemoStageId } from "./StageStrip";
import OperationsDashboard from "./dashboard/OperationsDashboard";
import MonitoringDashboard from "./dashboard/MonitoringDashboard";
import { useCaptureResearch } from "./useCaptureResearch";

const GOLDEN_EXAMPLE =
  DEMO_EXAMPLES.find((example) => example.url === DEMO_SNAPSHOT.sourceUrl) ??
  DEMO_EXAMPLES[0];

type View = "home" | "operations" | "intelligence" | "monitoring";
type Stage = "portfolio" | "intake" | "research" | "brief";

export default function Workspace({ liveReady }: { liveReady: boolean }) {
  const research = useCaptureResearch();
  const [view, setView] = useState<View>("home");
  const [stage, setStage] = useState<Stage>("portfolio");
  const [pursuits, setPursuits] = useState<Pursuit[]>([]);
  const [replaying, setReplaying] = useState(false);
  const [selected, setSelected] = useState<Pursuit | null>(null);
  const [snapshot, setSnapshot] = useState<NoticeSnapshot | null>(null);
  const [noticeSources, setNoticeSources] = useState<EvidenceSource[]>([]);
  const [intakeLoading, setIntakeLoading] = useState(false);
  const [intakeError, setIntakeError] = useState<string | null>(null);
  const [effort] = useState<Effort>("low");
  const [decision, setDecision] = useState<HumanDecision | null>(null);
  const [decisionActions, setDecisionActions] = useState<DecisionAction[]>([]);
  const [questions, setQuestions] = useState<BriefQuestion[]>([]);
  const [monitor, setMonitor] = useState<MonitorSubscription | null>(null);
  const [updates, setUpdates] = useState<PursuitUpdate[]>([]);
  const [pursuitId, setPursuitId] = useState(`pursuit-${Date.now()}`);
  const [guideOpen, setGuideOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const checkInFlight = useRef(false);

  useEffect(() => {
    void fetch("/api/pursuits")
      .then((response) => response.json())
      .then((body: { pursuits?: Pursuit[] }) => {
        if (body.pursuits?.length) {
          setPursuits(
            body.pursuits
              .filter((pursuit) => pursuit.id !== DEMO_PURSUIT.id)
              .map((pursuit) => ({
                ...pursuit,
                decisionActions: pursuit.decisionActions ?? [],
              })),
          );
        }
      })
      .catch(() => undefined);
  }, []);

  const activeBrief = research.brief ?? selected?.brief ?? null;
  const activeSources = research.sources.length
    ? research.sources
    : selected?.sources ?? noticeSources;
  const activeTrace = research.trace.length
    ? research.trace
    : selected?.trace ?? [];
  const activeStats = research.stats ?? selected?.stats ?? null;
  const activeWorkstreams = research.workstreams.length
    ? research.workstreams
    : selected?.workstreams ?? [];

  const activePursuit = useMemo<Pursuit | null>(() => {
    if (!snapshot) return null;
    return {
      id: pursuitId,
      name: snapshot.title.value ?? "Federal opportunity",
      snapshot,
      profile: FEDERAL_IDENTITY_PROFILE,
      sources: activeSources,
      brief: activeBrief,
      decision,
      decisionActions,
      trace: activeTrace,
      workstreams: activeWorkstreams,
      stats: activeStats,
      questions,
      monitor,
      updates,
      createdAt: selected?.createdAt ?? snapshot.fetchedAt,
      updatedAt: selected?.updatedAt ?? snapshot.fetchedAt,
    };
  }, [
    snapshot,
    pursuitId,
    activeSources,
    activeBrief,
    decision,
    decisionActions,
    activeTrace,
    activeWorkstreams,
    activeStats,
    questions,
    monitor,
    updates,
    selected?.createdAt,
    selected?.updatedAt,
  ]);

  useEffect(() => {
    if (!activePursuit?.brief) return;
    setPursuits((current) => {
      const index = current.findIndex((item) => item.id === activePursuit.id);
      if (index < 0) return [activePursuit, ...current];
      const next = [...current];
      next[index] = activePursuit;
      return next;
    });
    void fetch("/api/pursuits", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(activePursuit),
    });
  }, [activePursuit]);

  const openPursuit = useCallback((pursuit: Pursuit) => {
    setReplaying(false);
    setSelected(pursuit);
    setSnapshot(pursuit.snapshot);
    setNoticeSources(pursuit.sources);
    setPursuitId(pursuit.id);
    setDecision(pursuit.decision);
    setDecisionActions(pursuit.decisionActions ?? []);
    setQuestions(pursuit.questions);
    setMonitor(pursuit.monitor);
    setUpdates(pursuit.updates);
    setStage("brief");
    setView("intelligence");
  }, []);

  const intake = useCallback(async (url: string) => {
    setIntakeLoading(true);
    setIntakeError(null);
    try {
      const response = await fetch("/api/capture/intake", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const body = (await response.json()) as {
        snapshot?: NoticeSnapshot;
        sources?: EvidenceSource[];
        error?: string;
        note?: string;
      };
      if (!response.ok || !body.snapshot) {
        throw new Error(body.error ?? "Notice intake failed");
      }
      setSnapshot(body.snapshot);
      setNoticeSources(body.sources ?? []);
      setSelected(null);
      setPursuitId(`pursuit-${Date.now()}`);
      setDecision(null);
      setDecisionActions([]);
      setQuestions([]);
      setMonitor(null);
      setUpdates([]);
      setIntakeError(body.note ?? null);
      setStage("intake");
      setView("intelligence");
    } catch (reason) {
      setIntakeError(
        reason instanceof Error ? reason.message : "Notice intake failed",
      );
    } finally {
      setIntakeLoading(false);
    }
  }, []);

  const buildBrief = useCallback(
    (followup?: string) => {
      if (!snapshot) return;
      setReplaying(false);
      setStage("research");
      setView("intelligence");
      void research.start({
        snapshot,
        noticeSources,
        effort,
        previousRunId: followup
          ? (activeStats?.runId ?? undefined)
          : undefined,
        followup,
      });
    },
    [snapshot, noticeSources, effort, activeStats?.runId, research],
  );

  const runLiveCheck = useCallback(
    async (target?: NoticeSnapshot) => {
      const notice = target ?? snapshot;
      if (!notice || checkInFlight.current) return;
      checkInFlight.current = true;
      setMonitor((current) =>
        current ? { ...current, checking: true } : current,
      );
      try {
        const response = await fetch("/api/capture/monitor/check", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ snapshot: notice }),
        });
        const body = (await response.json()) as {
          checkedAt?: string;
          updates?: PursuitUpdate[];
        };
        const checkedAt = body.checkedAt ?? new Date().toISOString();
        setMonitor((current) =>
          current
            ? {
                ...current,
                checking: false,
                lastCheckedAt: checkedAt,
                nextRunAt: new Date(Date.now() + 45_000).toISOString(),
                status: "active",
              }
            : current,
        );
        if (body.updates?.length) {
          setUpdates((current) => {
            const known = new Set(current.map((item) => item.title));
            const fresh = body.updates!.filter(
              (item) => !known.has(item.title),
            );
            return [...fresh, ...current];
          });
        }
        setDecisionActions((current) =>
          current.map((action) =>
            action.status === "running"
              ? {
                  ...action,
                  status: "done",
                  detail: `${action.detail} Last live check ${new Date(
                    checkedAt,
                  ).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}.`,
                }
              : action,
          ),
        );
      } catch {
        setMonitor((current) =>
          current ? { ...current, checking: false } : current,
        );
      } finally {
        checkInFlight.current = false;
      }
    },
    [snapshot],
  );

  const watch = useCallback(async () => {
    if (!snapshot) return null;
    const response = await fetch("/api/capture/monitor", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ snapshot, pursuitId }),
    });
    const body = (await response.json()) as {
      monitor?: MonitorSubscription;
    };
    if (body.monitor) {
      setMonitor({ ...body.monitor, status: "active", checking: true });
      void runLiveCheck();
      return body.monitor;
    }
    return null;
  }, [snapshot, pursuitId, runLiveCheck]);

  const applyDecision = useCallback(
    (next: HumanDecision) => {
      if (!snapshot) return;
      setDecision(next);
      setDecisionActions(buildDecisionActions(next, snapshot));
      if (next === "pursue" || next === "hold") {
        void watch().then(() => {
          if (next === "pursue") setView("monitoring");
        });
      }
    },
    [snapshot, watch],
  );

  const replayLastResearch = useCallback(() => {
    setSelected(DEMO_PURSUIT);
    setSnapshot(DEMO_PURSUIT.snapshot);
    setNoticeSources(DEMO_PURSUIT.sources);
    setPursuitId(DEMO_PURSUIT.id);
    setDecision(null);
    setDecisionActions([]);
    setQuestions(DEMO_PURSUIT.questions);
    setMonitor(null);
    setUpdates([]);
    setReplaying(true);
    setStage("research");
    setView("intelligence");
  }, []);

  const resetDemo = useCallback(async () => {
    setResetting(true);
    try {
      await fetch("/api/pursuits", { method: "DELETE" });
      research.cancel();
      setPursuits([]);
      setSelected(null);
      setSnapshot(null);
      setNoticeSources([]);
      setDecision(null);
      setDecisionActions([]);
      setQuestions([]);
      setMonitor(null);
      setUpdates([]);
      setPursuitId(`pursuit-${Date.now()}`);
      setReplaying(false);
      setIntakeError(null);
      setGuideOpen(false);
      setStage("portfolio");
      setView("home");
      const input = document.getElementById(
        "home-notice-url",
      ) as HTMLInputElement | null;
      if (input) input.value = "";
    } finally {
      setResetting(false);
    }
  }, [research]);

  useEffect(() => {
    if (!monitor || monitor.status === "paused") return;
    void runLiveCheck();
    const timer = setInterval(() => void runLiveCheck(), 45_000);
    return () => clearInterval(timer);
  }, [monitor?.id, runLiveCheck]);

  const showOperations = pursuits.length >= 2;

  useEffect(() => {
    if (view === "operations" && !showOperations) {
      setView(snapshot ? "intelligence" : "home");
    }
  }, [view, showOperations, snapshot]);

  const stageStripActive = ((): DemoStageId | null => {
    if (view === "home") return null;
    if (view === "monitoring" || monitor) return "watch";
    if (stage === "intake") return "intake";
    if (stage === "research") return "research";
    if (stage === "brief" && decision) return "decision";
    if (stage === "brief") return "gates";
    return null;
  })();

  return (
    <div className="flex h-dvh min-h-[680px] flex-col overflow-hidden bg-paper">
      <header className="shrink-0 border-b border-line bg-raised/95 px-5 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between">
          <div className="flex h-full items-center gap-8">
            <button
              onClick={() => {
                setView("home");
                setStage("portfolio");
              }}
              className="flex items-center gap-2.5 text-sm font-bold tracking-tight text-ink"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-accent text-xs font-bold text-white shadow-[0_6px_18px_rgba(47,107,255,0.24)]">
                C
              </span>
              <span>
                Capture<span className="text-accent">Brief</span>
              </span>
            </button>
            {view !== "home" && (
            <nav className="flex items-center gap-1 rounded-xl bg-surface p-1">
              {(
                [
                  ...(showOperations
                    ? ([["operations", "Portfolio"]] as [View, string][])
                    : []),
                  ["intelligence", "Case"],
                  ["monitoring", "Monitoring"],
                ] as [View, string][]
              ).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => {
                    if (id === "intelligence" && !snapshot) {
                      openPursuit(pursuits[0] ?? DEMO_PURSUIT);
                    } else {
                      setView(id);
                    }
                  }}
                  className={`rounded-lg px-3.5 py-2 text-[11px] font-semibold transition-all ${
                    view === id
                      ? "bg-raised text-ink shadow-[0_2px_8px_rgba(16,24,40,0.08)]"
                      : "text-inksoft hover:text-ink"
                  }`}
                >
                  {label}
                </button>
              ))}
            </nav>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setGuideOpen(true)}
              className="rounded-lg border border-line px-3 py-1.5 text-[10px] font-semibold text-inksoft hover:border-accent/30 hover:text-accent"
            >
              What’s happening
            </button>
            <button
              onClick={() => void resetDemo()}
              disabled={resetting}
              className="rounded-lg border border-line px-3 py-1.5 text-[10px] font-semibold text-inksoft hover:border-halt/30 hover:text-halt disabled:opacity-50"
            >
              {resetting ? "Resetting…" : "Reset demo"}
            </button>
            <div className="hidden text-right sm:block sm:pl-1">
              <p className="text-[11px] font-semibold text-ink">
                {FEDERAL_IDENTITY_PROFILE.name}
              </p>
              <p className="text-[9px] text-inkfaint">
                {liveReady ? "Exa connected" : "Captured-run mode"}
              </p>
            </div>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-[10px] font-semibold text-white">
              MF
            </span>
          </div>
        </div>
      </header>

      <DemoGuide
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        onUseExample={(url) => {
          setGuideOpen(false);
          const input = document.getElementById(
            "home-notice-url",
          ) as HTMLInputElement | null;
          if (input) input.value = url;
          void intake(url);
        }}
      />

      {stageStripActive && <StageStrip active={stageStripActive} />}

      <div className="min-h-0 flex-1 overflow-y-auto">
        {view === "home" && (
          <section className="mx-auto flex min-h-full max-w-6xl items-center px-5 py-12">
            <div className="grid w-full items-center gap-12 lg:grid-cols-[1.08fr_0.92fr]">
              <div>
                <p className="text-[11px] font-semibold text-accent">
                  Federal capture intelligence
                </p>
                <h1 className="mt-3 max-w-2xl font-display text-5xl font-semibold leading-[1.05] tracking-[-0.045em] text-ink">
                  Start with a notice.
                  <br />
                  Leave with a decision.
                </h1>
                <p className="mt-5 max-w-xl text-base leading-relaxed text-inksoft">
                  Exa retrieves the official opportunity, researches agency and
                  acquisition context, and builds a cited case — so capture
                  leads can Pursue, Hold, or Pass without wasting hours.
                </p>
                <div className="mt-8 rounded-[16px] border border-line bg-raised p-3 shadow-[0_18px_55px_rgba(16,24,40,0.08)]">
                  <label className="px-2 text-[10px] font-semibold text-inksoft">
                    SAM.gov or official federal notice
                  </label>
                  <div className="mt-2 flex gap-2">
                    <input
                      id="home-notice-url"
                      defaultValue={GOLDEN_EXAMPLE.url}
                      placeholder="https://sam.gov/opp/…/view"
                      className="min-w-0 flex-1 rounded-xl border border-line bg-surface px-4 py-3 text-xs text-ink outline-none focus:border-accent"
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          const value = event.currentTarget.value.trim();
                          if (value) void intake(value);
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        const input = document.getElementById(
                          "home-notice-url",
                        ) as HTMLInputElement | null;
                        if (input?.value.trim()) void intake(input.value.trim());
                      }}
                      disabled={intakeLoading}
                      className="rounded-xl bg-accent px-5 py-3 text-xs font-semibold text-white"
                    >
                      {intakeLoading ? "Retrieving…" : "Review notice"}
                    </button>
                  </div>
                  <p className="mt-2 px-2 text-[10px] text-inksoft">
                    Recommended: {GOLDEN_EXAMPLE.label}. Expect{" "}
                    <span className="font-semibold text-halt">blocked</span> —
                    inactive notice is the win (saved capture hours).
                  </p>
                  {intakeError && (
                    <p className="mt-2 px-2 text-[10px] text-halt">
                      {intakeError}
                    </p>
                  )}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-4">
                  <button
                    onClick={() => void intake(GOLDEN_EXAMPLE.url)}
                    className="text-xs font-semibold text-accent hover:underline"
                  >
                    Run recommended notice →
                  </button>
                  <button
                    onClick={replayLastResearch}
                    className="text-xs font-semibold text-inksoft hover:text-accent"
                  >
                    Replay captured research
                  </button>
                  <button
                    onClick={() => setGuideOpen(true)}
                    className="text-xs font-semibold text-inksoft hover:text-accent"
                  >
                    More examples + Exa map
                  </button>
                </div>
              </div>
              <aside className="border-l border-line pl-8">
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-inkfaint">
                  Interview path
                </p>
                <ol className="mt-5 space-y-4">
                  {[
                    ["01", "Intake", "exa.getContents — confirm the official notice"],
                    ["02", "Research", "exa.search + agent.runs — linger, then open case"],
                    ["03", "Gates", "Hard gates decide readiness; AI does not bid"],
                    ["04", "Decide", "Pass / Hold / Pursue creates a real packet"],
                    ["05", "Watch", "exa.search / monitors — amendments stay live"],
                  ].map(([number, title, description]) => (
                    <li key={number} className="grid grid-cols-[32px_1fr] gap-3">
                      <span className="font-mono text-[10px] text-accent">
                        {number}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-ink">{title}</p>
                        <p className="mt-1 text-xs leading-relaxed text-inksoft">
                          {description}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </aside>
            </div>
          </section>
        )}

        {view === "operations" && showOperations && (
          <OperationsDashboard
            pursuits={pursuits}
            liveReady={liveReady}
            intakeLoading={intakeLoading}
            intakeError={intakeError}
            onOpen={openPursuit}
            onIntake={(url) => void intake(url || DEMO_SNAPSHOT.sourceUrl)}
          />
        )}

        {view === "monitoring" && (
          <MonitoringDashboard
            pursuits={pursuits}
            onOpen={openPursuit}
            onRefresh={(pursuit) => {
              setSelected(pursuit);
              setSnapshot(pursuit.snapshot);
              setNoticeSources(pursuit.sources);
              setPursuitId(pursuit.id);
              setDecision(pursuit.decision);
              setDecisionActions(pursuit.decisionActions ?? []);
              setQuestions(pursuit.questions);
              setMonitor(pursuit.monitor);
              setUpdates(pursuit.updates);
              void runLiveCheck(pursuit.snapshot);
            }}
          />
        )}

        {view === "intelligence" && stage === "intake" && snapshot && (
          <IntakeStage
            snapshot={snapshot}
            loading={intakeLoading}
            error={intakeError}
            onBack={() => {
              setView("home");
              setStage("portfolio");
            }}
            onResearch={() => buildBrief()}
          />
        )}

        {view === "intelligence" && stage === "research" && replaying && (
          <ResearchReplay
            onComplete={() => {
              setReplaying(false);
              setStage("brief");
              setPursuits((current) =>
                current.some((item) => item.id === DEMO_PURSUIT.id)
                  ? current
                  : [DEMO_PURSUIT, ...current],
              );
            }}
          />
        )}

        {view === "intelligence" && stage === "research" && !replaying && (
          <ResearchCanvas
            workstreams={research.workstreams}
            trace={research.trace}
            running={research.running}
            elapsed={research.elapsed}
            stats={research.stats}
            onCancel={research.cancel}
            onOpen={() => setStage("brief")}
          />
        )}

        {view === "intelligence" &&
          stage === "brief" &&
          snapshot &&
          activeBrief && (
            <CaptureBriefView
              snapshot={snapshot}
              brief={activeBrief}
              sources={activeSources}
              trace={activeTrace}
              stats={activeStats}
              decision={decision}
              decisionActions={decisionActions}
              questions={questions}
              monitor={monitor}
              updates={updates}
              pursuits={pursuits}
              onSelectPursuit={openPursuit}
              onDecision={applyDecision}
              onQuestion={(question) =>
                setQuestions((current) => [...current, question])
              }
              onDeepen={(question) =>
                buildBrief(`Investigate deeply: ${question}`)
              }
              onWatch={() => void watch()}
              onOpenMonitoring={() => setView("monitoring")}
            />
          )}
      </div>
    </div>
  );
}
