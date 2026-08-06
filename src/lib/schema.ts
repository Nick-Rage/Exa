import { CAPTURE_GATES } from "./profile";
import type { ContractorProfile, EvidenceSource, NoticeSnapshot } from "./types";

const factSchema = {
  type: "object",
  required: ["label", "value", "state"],
  properties: {
    label: { type: "string" },
    value: { type: "string" },
    state: { type: "string", enum: ["verified", "inference", "unknown"] },
  },
} as const;

export const CAPTURE_BRIEF_SCHEMA = {
  type: "object",
  required: [
    "executive_summary",
    "strongest_reasons",
    "largest_risks",
    "gates",
    "sections",
    "unknowns",
    "next_actions",
    "contracting_officer_questions",
  ],
  properties: {
    executive_summary: { type: "string" },
    strongest_reasons: {
      type: "array",
      maxItems: 3,
      items: { type: "string" },
    },
    largest_risks: {
      type: "array",
      maxItems: 3,
      items: { type: "string" },
    },
    gates: {
      type: "array",
      maxItems: 5,
      items: {
        type: "object",
        required: ["id", "state", "explanation"],
        properties: {
          id: { type: "string" },
          state: { type: "string", enum: ["pass", "fail", "unclear"] },
          explanation: { type: "string" },
        },
      },
    },
    sections: {
      type: "array",
      maxItems: 5,
      items: {
        type: "object",
        required: ["id", "summary", "facts"],
        properties: {
          id: {
            type: "string",
            enum: ["requirements", "agency", "funding", "acquisition", "fit"],
          },
          summary: { type: "string" },
          facts: {
            type: "array",
            maxItems: 8,
            items: factSchema,
          },
        },
      },
    },
    unknowns: {
      type: "array",
      maxItems: 8,
      items: { type: "string" },
    },
    next_actions: {
      type: "array",
      maxItems: 8,
      items: { type: "string" },
    },
    contracting_officer_questions: {
      type: "array",
      maxItems: 8,
      items: { type: "string" },
    },
  },
} as const;

export function buildCaptureQuery(
  snapshot: NoticeSnapshot,
  profile: ContractorProfile,
  sources: EvidenceSource[],
): string {
  const gateText = CAPTURE_GATES.map(
    (gate) => `- ${gate.id}: ${gate.description}`,
  ).join("\n");

  const sourceText = sources
    .slice(0, 20)
    .map(
      (source, index) =>
        `[${index + 1}] ${source.title} (${source.url})${source.excerpt ? `\n${source.excerpt}` : ""}`,
    )
    .join("\n\n");

  return [
    "Build a federal opportunity capture brief for a human bid/no-bid gate.",
    "Do not make the final pursuit decision. Report evidence, hard-gate states, risks, unknowns, and next actions.",
    "Never present an incumbent, funding level, contract vehicle, clearance, or requirement as verified without official evidence. Use inference or unknown honestly.",
    "",
    `NOTICE TITLE: ${snapshot.title.value ?? "Unknown"}`,
    `NOTICE URL: ${snapshot.sourceUrl}`,
    `AGENCY: ${snapshot.agency.value ?? "Unknown"}`,
    `SOLICITATION: ${snapshot.solicitationNumber.value ?? "Unknown"}`,
    `DEADLINE: ${snapshot.responseDeadline.value ?? "Unknown"}`,
    "",
    `CONTRACTOR: ${profile.name}`,
    profile.description,
    `Capabilities: ${profile.capabilities.join("; ")}`,
    `Vehicles: ${profile.contractVehicles.join("; ")}`,
    `Certifications: ${profile.certifications.join("; ")}`,
    `Hard disqualifiers: ${profile.hardDisqualifiers.join("; ")}`,
    "",
    "Evaluate exactly these gates:",
    gateText,
    "",
    "Return exactly five sections: requirements, agency, funding, acquisition, fit.",
    "For every fact use verified, inference, or unknown. Keep unknowns visible instead of guessing.",
    "",
    "SEED EVIDENCE:",
    sourceText,
  ].join("\n");
}
