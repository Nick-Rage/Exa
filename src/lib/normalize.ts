import { CAPTURE_GATES } from "./profile";
import type {
  BriefSection,
  CaptureBrief,
  EvidenceSource,
  GateAssessment,
  GateState,
  Readiness,
} from "./types";

type Loose = Record<string, unknown>;

export function record(value: unknown): Loose {
  return value && typeof value === "object" ? (value as Loose) : {};
}

export function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function arrayValue(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function classifyAuthority(
  url: string,
): EvidenceSource["authority"] {
  const host = hostname(url).toLowerCase();
  if (host.endsWith(".gov") || host.endsWith(".mil") || host === "sam.gov") {
    return "official";
  }
  if (
    host.includes("usaspending") ||
    host.includes("fpds") ||
    host.includes("govinfo")
  ) {
    return "authoritative";
  }
  return "secondary";
}

export function deriveReadiness(
  gates: GateAssessment[],
): { readiness: Readiness; reason: string } {
  const hardFails = gates.filter(
    (gate) => gate.hardGate && gate.state === "fail",
  );
  if (hardFails.length > 0) {
    return {
      readiness: "blocked",
      reason: `Blocked by ${hardFails.map((gate) => gate.label).join(", ")}`,
    };
  }

  const unclear = gates.filter(
    (gate) => gate.hardGate && gate.state === "unclear",
  );
  if (unclear.length > 0) {
    return {
      readiness: "review",
      reason: `Confirm ${unclear.map((gate) => gate.label).join(", ")}`,
    };
  }

  return {
    readiness: "ready",
    reason: "All hard gates supported",
  };
}

const SECTION_TITLE: Record<BriefSection["id"], string> = {
  requirements: "Requirements",
  agency: "Agency context",
  funding: "Funding",
  acquisition: "Acquisition history",
  fit: "Contractor fit",
};

function groundingSources(output: unknown): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const raw of arrayValue(record(output).grounding)) {
    const entry = record(raw);
    const field = stringValue(entry.field);
    if (!field) continue;
    const urls = arrayValue(entry.citations)
      .map((citation) => stringValue(record(citation).url))
      .filter((url): url is string => Boolean(url));
    map.set(field, urls);
  }
  return map;
}

function groundingForFact(
  grounding: Map<string, string[]>,
  sectionIndex: number,
  factIndex: number,
): string[] {
  const sectionTokens = [
    `sections[${sectionIndex}]`,
    `sections.${sectionIndex}`,
  ];
  const factTokens = [`facts[${factIndex}]`, `facts.${factIndex}`];
  const exact = [...grounding.entries()].find(
    ([field]) =>
      sectionTokens.some((token) => field.includes(token)) &&
      factTokens.some((token) => field.includes(token)),
  );
  if (exact) return exact[1];
  const section = [...grounding.entries()].find(([field]) =>
    sectionTokens.some((token) => field.includes(token)),
  );
  return section?.[1] ?? [];
}

export function normalizeCaptureBrief(
  output: unknown,
  sources: EvidenceSource[],
): CaptureBrief {
  const root = record(output);
  const structured = record(root.structured ?? root.content ?? root);
  const grounding = groundingSources(root);
  const sourceByUrl = new Map(sources.map((source) => [source.url, source.id]));

  const rawGates = arrayValue(structured.gates).map(record);
  const gates: GateAssessment[] = CAPTURE_GATES.map((spec) => {
    const raw = rawGates.find((gate) => stringValue(gate.id) === spec.id) ?? {};
    const token = stringValue(raw.state);
    const state: GateState =
      token === "pass" || token === "fail" ? token : "unclear";
    return {
      id: spec.id,
      label: spec.label,
      state,
      explanation:
        stringValue(raw.explanation) ?? "No supported assessment returned.",
      sourceIds: [],
      hardGate: spec.hardGate,
    };
  });

  const rawSections = arrayValue(structured.sections).map(record);
  const sections = (
    ["requirements", "agency", "funding", "acquisition", "fit"] as const
  ).map((id, sectionIndex): BriefSection => {
    const raw =
      rawSections.find((section) => stringValue(section.id) === id) ?? {};
    const factRows = arrayValue(raw.facts).map(record);
    return {
      id,
      title: SECTION_TITLE[id],
      summary: stringValue(raw.summary) ?? "No supported summary returned.",
      facts: factRows.map((fact, factIndex) => {
        const ids = groundingForFact(grounding, sectionIndex, factIndex)
          .map((url) => sourceByUrl.get(url))
          .filter((sourceId): sourceId is string => Boolean(sourceId));
        const state = stringValue(fact.state);
        return {
          label: stringValue(fact.label) ?? "Finding",
          value: stringValue(fact.value) ?? "Unknown",
          state:
            state === "verified" || state === "inference"
              ? state
              : "unknown",
          sourceIds: ids,
        };
      }),
    };
  });

  const { readiness, reason } = deriveReadiness(gates);
  const firstGrounding = arrayValue(root.grounding)[0];
  const confidence = stringValue(record(firstGrounding).confidence);

  return {
    executiveSummary:
      stringValue(structured.executive_summary) ??
      "The research run did not return an executive summary.",
    strongestReasons: arrayValue(structured.strongest_reasons)
      .map(stringValue)
      .filter((value): value is string => Boolean(value))
      .slice(0, 3),
    largestRisks: arrayValue(structured.largest_risks)
      .map(stringValue)
      .filter((value): value is string => Boolean(value))
      .slice(0, 3),
    gates,
    sections,
    unknowns: arrayValue(structured.unknowns)
      .map(stringValue)
      .filter((value): value is string => Boolean(value)),
    nextActions: arrayValue(structured.next_actions)
      .map(stringValue)
      .filter((value): value is string => Boolean(value)),
    contractingOfficerQuestions: arrayValue(
      structured.contracting_officer_questions,
    )
      .map(stringValue)
      .filter((value): value is string => Boolean(value)),
    readiness,
    readinessReason: reason,
    groundingConfidence:
      confidence === "low" || confidence === "medium" || confidence === "high"
        ? confidence
        : null,
    generatedAt: new Date().toISOString(),
  };
}
