"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  CaptureBrief,
  Effort,
  EvidenceSource,
  NoticeSnapshot,
  ResearchWorkstream,
  RunStats,
  TraceEvent,
} from "@/lib/types";

type Frame = { event: string; data: string };

function parseFrames(chunk: string): Frame[] {
  return chunk
    .split("\n\n")
    .map((block) => {
      let event = "";
      const data: string[] = [];
      for (const line of block.split("\n")) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        if (line.startsWith("data:")) data.push(line.slice(5).trim());
      }
      return { event, data: data.join("\n") };
    })
    .filter((frame) => frame.event && frame.data);
}

export function useCaptureResearch() {
  const [brief, setBrief] = useState<CaptureBrief | null>(null);
  const [sources, setSources] = useState<EvidenceSource[]>([]);
  const [trace, setTrace] = useState<TraceEvent[]>([]);
  const [workstreams, setWorkstreams] = useState<ResearchWorkstream[]>([]);
  const [stats, setStats] = useState<RunStats | null>(null);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [demo, setDemo] = useState(false);

  const abort = useRef<AbortController | null>(null);
  const clock = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (clock.current) clearInterval(clock.current);
    clock.current = null;
  }, []);

  useEffect(
    () => () => {
      abort.current?.abort();
      stop();
    },
    [stop],
  );

  const cancel = useCallback(() => {
    abort.current?.abort();
    stop();
    setRunning(false);
  }, [stop]);

  const start = useCallback(
    async ({
      snapshot,
      noticeSources,
      effort,
      previousRunId,
      followup,
    }: {
      snapshot: NoticeSnapshot;
      noticeSources: EvidenceSource[];
      effort: Effort;
      previousRunId?: string;
      followup?: string;
    }) => {
      abort.current?.abort();
      const controller = new AbortController();
      abort.current = controller;
      setRunning(true);
      setElapsed(0);
      setError(null);
      setBrief(null);
      setTrace([]);
      setWorkstreams([]);
      setStats(null);
      setDemo(false);
      setSources(noticeSources);

      const started = Date.now();
      stop();
      clock.current = setInterval(
        () => setElapsed(Math.round((Date.now() - started) / 1000)),
        250,
      );

      try {
        const response = await fetch("/api/capture/research", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            snapshot,
            sources: noticeSources,
            effort,
            previousRunId,
            followup,
          }),
          signal: controller.signal,
        });
        if (!response.body) throw new Error("No research stream returned");
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const boundary = buffer.lastIndexOf("\n\n");
          if (boundary < 0) continue;
          const complete = buffer.slice(0, boundary + 2);
          buffer = buffer.slice(boundary + 2);

          for (const frame of parseFrames(complete)) {
            const payload = JSON.parse(frame.data) as unknown;
            if (frame.event === "demo") setDemo(true);
            if (frame.event === "trace") {
              setTrace((current) => [...current, payload as TraceEvent]);
            }
            if (frame.event === "workstream") {
              const workstream = payload as ResearchWorkstream;
              setWorkstreams((current) => {
                const index = current.findIndex(
                  (item) => item.id === workstream.id,
                );
                if (index < 0) return [...current, workstream];
                const next = [...current];
                next[index] = workstream;
                return next;
              });
            }
            if (frame.event === "done") {
              const result = payload as {
                brief: CaptureBrief;
                sources: EvidenceSource[];
                stats: RunStats;
              };
              setBrief(result.brief);
              setSources(result.sources);
              setStats(result.stats);
            }
            if (frame.event === "failed") {
              setError((payload as { message: string }).message);
            }
          }
        }
      } catch (reason) {
        if (!controller.signal.aborted) {
          setError(
            reason instanceof Error ? reason.message : "Research request failed",
          );
        }
      } finally {
        stop();
        setRunning(false);
      }
    },
    [stop],
  );

  return {
    brief,
    sources,
    trace,
    workstreams,
    stats,
    running,
    elapsed,
    error,
    demo,
    start,
    cancel,
  };
}
