import { NextResponse } from "next/server";
import { getExa, hasExaKey, isForcedDemoMode } from "@/lib/exa";
import { saveMonitorSecret } from "@/lib/pursuitStore";
import type { NoticeSnapshot } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const snapshot = body?.snapshot as NoticeSnapshot | undefined;
  const pursuitId =
    typeof body?.pursuitId === "string" ? body.pursuitId : "pursuit";

  if (!snapshot?.sourceUrl) {
    return NextResponse.json({ error: "Notice required" }, { status: 400 });
  }

  const appUrl = process.env.APP_URL;
  const webhookReady = Boolean(appUrl?.startsWith("https://"));

  // Local / interview demos often lack a public HTTPS webhook URL.
  // Still return an active monitor so the UI can run live Exa checks.
  if (isForcedDemoMode() || !hasExaKey() || !webhookReady) {
    const createdAt = new Date().toISOString();
    return NextResponse.json({
      monitor: {
        id: webhookReady ? "monitor_live_local" : "monitor_live_check",
        status: "active",
        createdAt,
        nextRunAt: new Date(Date.now() + 60_000).toISOString(),
        lastCheckedAt: null,
        checking: false,
      },
      demo: false,
      liveCheck: true,
      note: webhookReady
        ? "Live Exa monitor checks enabled."
        : "Live Exa change checks enabled. Set APP_URL to a public HTTPS URL for signed webhook delivery.",
    });
  }

  const exa = getExa();
  const monitor = await exa.monitors.create({
    name: `${snapshot.solicitationNumber.value ?? "Federal pursuit"} changes`,
    search: {
      query: [
        `"${snapshot.solicitationNumber.value ?? ""}"`,
        snapshot.title.value ?? "",
        "amendment deadline attachment Q&A cancellation award",
      ]
        .filter(Boolean)
        .join(" "),
      numResults: 10,
      includeDomains: ["sam.gov", "gov"],
      contents: {
        highlights: {
          query: "what changed deadline amendment status attachment award",
          maxCharacters: 3_000,
        },
        maxAgeHours: 0,
      },
    },
    trigger: { type: "interval", period: "24h" },
    outputSchema: {
      type: "object",
      required: ["changes"],
      properties: {
        changes: {
          type: "array",
          items: {
            type: "object",
            required: ["type", "title", "description", "url"],
            properties: {
              type: {
                type: "string",
                enum: [
                  "deadline",
                  "attachment",
                  "status",
                  "amendment",
                  "signal",
                ],
              },
              title: { type: "string" },
              description: { type: "string" },
              url: { type: "string" },
            },
          },
        },
      },
    },
    metadata: { pursuitId },
    webhook: {
      url: `${appUrl!.replace(/\/$/, "")}/api/capture/monitor/webhook`,
      events: ["monitor.run.completed"],
    },
  });

  await saveMonitorSecret(monitor.id, monitor.webhookSecret);

  return NextResponse.json({
    monitor: {
      id: monitor.id,
      status: monitor.status,
      createdAt: monitor.createdAt,
      nextRunAt: monitor.nextRunAt,
    },
    demo: false,
  });
}
