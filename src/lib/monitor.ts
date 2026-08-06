import { createHmac, timingSafeEqual } from "node:crypto";
import type { EvidenceSource, PursuitUpdate } from "./types";

function signatureParts(header: string): {
  timestamp: string | null;
  signatures: string[];
} {
  const values = header.split(",").map((part) => part.trim());
  return {
    timestamp:
      values.find((part) => part.startsWith("t="))?.slice(2) ?? null,
    signatures: values
      .filter((part) => part.startsWith("v1="))
      .map((part) => part.slice(3)),
  };
}

export function signMonitorPayload(
  rawBody: string,
  timestamp: string,
  secret: string,
): string {
  return createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");
}

export function verifyMonitorSignature(
  rawBody: string,
  header: string,
  secret: string,
): boolean {
  const { timestamp, signatures } = signatureParts(header);
  if (!timestamp || signatures.length === 0) return false;
  const expected = signMonitorPayload(rawBody, timestamp, secret);
  return signatures.some((candidate) => {
    try {
      const left = Buffer.from(expected, "hex");
      const right = Buffer.from(candidate, "hex");
      return left.length === right.length && timingSafeEqual(left, right);
    } catch {
      return false;
    }
  });
}

export function deduplicateUpdates(
  existing: PursuitUpdate[],
  incoming: PursuitUpdate[],
): PursuitUpdate[] {
  const seen = new Set(
    existing.map(
      (update) =>
        `${update.type}:${update.title.toLowerCase()}:${update.source.url}`,
    ),
  );
  return incoming.filter((update) => {
    const key = `${update.type}:${update.title.toLowerCase()}:${update.source.url}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function sourceChanged(
  before: EvidenceSource,
  after: EvidenceSource,
): boolean {
  return (
    before.url !== after.url ||
    before.excerpt?.trim() !== after.excerpt?.trim()
  );
}
