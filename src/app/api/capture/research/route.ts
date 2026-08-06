import { FEDERAL_IDENTITY_PROFILE } from "@/lib/profile";
import { DEMO_PURSUIT } from "@/lib/federalDemo";
import { hasExaKey, isForcedDemoMode } from "@/lib/exa";
import { streamCaptureResearch } from "@/lib/search";
import type {
  Effort,
  EvidenceSource,
  NoticeSnapshot,
} from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const EFFORTS: Effort[] = ["low", "medium", "high"];
const encoder = new TextEncoder();

function sse(event: string, data: unknown): Uint8Array {
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

function replayDemo(): ReadableStream<Uint8Array> {
  return new ReadableStream({
    async start(controller) {
      controller.enqueue(sse("demo", { value: true }));
      for (const workstream of DEMO_PURSUIT.workstreams) {
        controller.enqueue(sse("workstream", workstream));
      }
      for (const event of DEMO_PURSUIT.trace) {
        controller.enqueue(sse("trace", event));
        await new Promise((resolve) => setTimeout(resolve, 130));
      }
      controller.enqueue(
        sse("done", {
          brief: DEMO_PURSUIT.brief,
          sources: DEMO_PURSUIT.sources,
          stats: DEMO_PURSUIT.stats,
        }),
      );
      controller.close();
    },
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const snapshot = body?.snapshot as NoticeSnapshot | undefined;
  const noticeSources = Array.isArray(body?.sources)
    ? (body.sources as EvidenceSource[])
    : [];

  if (!snapshot?.sourceUrl) {
    return new Response(JSON.stringify({ error: "Notice snapshot required" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  if (isForcedDemoMode() || !hasExaKey()) {
    return new Response(replayDemo(), {
      headers: {
        "content-type": "text/event-stream; charset=utf-8",
        "cache-control": "no-cache, no-transform",
      },
    });
  }

  const effort: Effort = EFFORTS.includes(body?.effort)
    ? body.effort
    : "low";

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(encoder.encode(": open\n\n"));
      try {
        for await (const progress of streamCaptureResearch({
          snapshot,
          profile: FEDERAL_IDENTITY_PROFILE,
          noticeSources,
          effort,
          previousRunId:
            typeof body?.previousRunId === "string"
              ? body.previousRunId
              : undefined,
          followup:
            typeof body?.followup === "string" ? body.followup : undefined,
        })) {
          if (progress.type === "workstream") {
            controller.enqueue(sse("workstream", progress.workstream));
          } else if (progress.type === "trace") {
            controller.enqueue(sse("trace", progress.event));
          } else if (progress.type === "done") {
            controller.enqueue(sse("done", progress.result));
          } else {
            controller.enqueue(sse("failed", { message: progress.message }));
          }
        }
      } catch (error) {
        controller.enqueue(
          sse("failed", {
            message:
              error instanceof Error ? error.message : "Research stream failed",
          }),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "x-accel-buffering": "no",
    },
  });
}
