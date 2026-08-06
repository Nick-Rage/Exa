import { NextResponse } from "next/server";
import {
  getMonitorSecret,
  getPursuit,
  patchPursuit,
} from "@/lib/pursuitStore";
import { classifyAuthority, hostname, record, stringValue } from "@/lib/normalize";
import { deduplicateUpdates, verifyMonitorSignature } from "@/lib/monitor";
import type { PursuitUpdate } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const payload = record(JSON.parse(rawBody));
  const data = record(payload.data);
  const monitorId =
    stringValue(data.monitorId) ??
    stringValue(record(data.monitor).id) ??
    stringValue(payload.monitorId);
  if (!monitorId) {
    return NextResponse.json({ error: "Monitor ID missing" }, { status: 400 });
  }

  const secret = await getMonitorSecret(monitorId);
  const signature = request.headers.get("exa-signature") ?? "";
  if (!secret || !verifyMonitorSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const metadata = record(data.metadata ?? record(data.monitor).metadata);
  const pursuitId = stringValue(metadata.pursuitId);
  if (!pursuitId) return NextResponse.json({ received: true });
  const pursuit = await getPursuit(pursuitId);
  if (!pursuit) return NextResponse.json({ received: true });

  const output = record(record(data.output).content);
  const changes = Array.isArray(output.changes) ? output.changes : [];
  const updates: PursuitUpdate[] = changes.map((raw, index) => {
    const change = record(raw);
    const url = stringValue(change.url) ?? pursuit.snapshot.sourceUrl;
    const type = stringValue(change.type);
    return {
      id: `${monitorId}-${Date.now()}-${index}`,
      type:
        type === "deadline" ||
        type === "attachment" ||
        type === "status" ||
        type === "amendment"
          ? type
          : "signal",
      title: stringValue(change.title) ?? "Pursuit update",
      description:
        stringValue(change.description) ?? "New information detected.",
      detectedAt: new Date().toISOString(),
      source: {
        id: `monitor-source-${index}`,
        title: stringValue(change.title) ?? url,
        url,
        domain: hostname(url),
        authority: classifyAuthority(url),
        category: "notice",
        excerpt: stringValue(change.description),
        retrievedAt: new Date().toISOString(),
      },
      read: false,
    };
  });

  const unique = deduplicateUpdates(pursuit.updates, updates);
  await patchPursuit(pursuitId, {
    updates: [...unique, ...pursuit.updates],
  });
  return NextResponse.json({ received: true, updates: unique.length });
}
