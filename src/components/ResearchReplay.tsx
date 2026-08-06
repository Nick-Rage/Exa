"use client";

import { useEffect, useState } from "react";
import {
  DEMO_TRACE,
  DEMO_WORKSTREAMS,
  DEMO_STATS,
} from "@/lib/federalDemo";
import type { ResearchWorkstream, TraceEvent } from "@/lib/types";
import ResearchCanvas from "./ResearchCanvas";

export default function ResearchReplay({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const [trace, setTrace] = useState<TraceEvent[]>([]);
  const [workstreams, setWorkstreams] = useState<ResearchWorkstream[]>(
    DEMO_WORKSTREAMS.map((item) => ({ ...item, status: "pending" })),
  );
  const [elapsed, setElapsed] = useState(0);
  const done = trace.length === DEMO_TRACE.length;

  useEffect(() => {
    if (done) return;
    const timer = setTimeout(() => {
      const event = DEMO_TRACE[trace.length];
      setTrace((current) => [...current, event]);
      setElapsed(Math.ceil(event.at / 1000));
      setWorkstreams((current) =>
        current.map((item) => {
          if (item.id === event.workstream) {
            return {
              ...item,
              status: event.kind === "done" ? "complete" : "active",
              detail:
                event.kind === "done"
                  ? "Evidence-backed brief ready"
                  : event.text,
            };
          }
          const eventIndex = DEMO_WORKSTREAMS.findIndex(
            (workstream) => workstream.id === event.workstream,
          );
          const itemIndex = DEMO_WORKSTREAMS.findIndex(
            (workstream) => workstream.id === item.id,
          );
          return itemIndex < eventIndex
            ? { ...item, status: "complete" }
            : item;
        }),
      );
    }, 480);
    return () => clearTimeout(timer);
  }, [done, trace.length]);

  return (
    <ResearchCanvas
      workstreams={workstreams}
      trace={trace}
      running={!done}
      elapsed={elapsed}
      stats={done ? DEMO_STATS : null}
      onCancel={onComplete}
      onOpen={onComplete}
    />
  );
}
