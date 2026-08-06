import { FEDERAL_IDENTITY_PROFILE } from "./profile";
import type {
  BriefQuestion,
  CaptureBrief,
  EvidenceSource,
  NoticeSnapshot,
  Pursuit,
  PursuitUpdate,
  ResearchWorkstream,
  RunStats,
  TraceEvent,
} from "./types";

const now = "2026-08-05T07:00:00.000Z";

export const DEMO_SOURCES: EvidenceSource[] = [
  {
    id: "src-notice",
    title:
      "Sources Sought Notice for ICAM and dynamic access control solutions",
    url: "https://sam.gov/opp/887384ceab80465193079e1a6c477513/view",
    domain: "sam.gov",
    authority: "official",
    category: "notice",
    excerpt:
      "The U.S. Army C5ISR Center seeks ICAM and dynamic access-control technologies for tactical, resource-constrained environments.",
    retrievedAt: now,
  },
  {
    id: "src-cisa",
    title: "Federal Zero Trust Strategy",
    url: "https://www.cisa.gov/zero-trust-maturity-model",
    domain: "cisa.gov",
    authority: "official",
    category: "strategy",
    excerpt:
      "Identity is one of five pillars used to organize agency Zero Trust implementation.",
    retrievedAt: now,
  },
  {
    id: "src-nist",
    title: "Digital Identity Guidelines",
    url: "https://pages.nist.gov/800-63-4/",
    domain: "nist.gov",
    authority: "official",
    category: "mandate",
    excerpt:
      "NIST SP 800-63 provides technical requirements for identity proofing, authentication, and federation.",
    retrievedAt: now,
  },
  {
    id: "src-budget",
    title: "Department of the Army budget materials",
    url: "https://www.asafm.army.mil/Budget-Materials/",
    domain: "asafm.army.mil",
    authority: "official",
    category: "budget",
    excerpt:
      "Official Army budget materials provide portfolio-level context; notice-level funding is not stated.",
    retrievedAt: now,
  },
  {
    id: "src-award",
    title: "Federal award profile — enterprise identity services",
    url: "https://www.usaspending.gov/",
    domain: "usaspending.gov",
    authority: "authoritative",
    category: "acquisition",
    excerpt:
      "Related identity services awards show recurring professional-services spend; the current incumbent is not confirmed from public evidence.",
    retrievedAt: now,
  },
];

export const DEMO_SNAPSHOT: NoticeSnapshot = {
  sourceUrl: DEMO_SOURCES[0].url,
  title: {
    value: "ICAM and Dynamic Access Control Solutions",
    state: "verified",
    sourceIds: ["src-notice"],
  },
  agency: {
    value: "U.S. Department of the Army",
    state: "verified",
    sourceIds: ["src-notice"],
  },
  office: {
    value: "DEVCOM C5ISR Center, Engineering & Systems Integration",
    state: "verified",
    sourceIds: ["src-notice"],
  },
  solicitationNumber: {
    value: null,
    state: "unknown",
    sourceIds: [],
  },
  noticeType: {
    value: "Sources Sought / Request for Information",
    state: "verified",
    sourceIds: ["src-notice"],
  },
  status: {
    value: "Inactive",
    state: "verified",
    sourceIds: ["src-notice"],
  },
  responseDeadline: {
    value: null,
    state: "unknown",
    sourceIds: [],
  },
  responseDeadlineIso: {
    value: null,
    state: "unknown",
    sourceIds: [],
  },
  amendmentDate: {
    value: null,
    state: "unknown",
    sourceIds: [],
  },
  naics: {
    value: null,
    state: "unknown",
    sourceIds: [],
  },
  psc: {
    value: null,
    state: "unknown",
    sourceIds: [],
  },
  setAside: {
    value: "Business concerns invited; final acquisition strategy not stated",
    state: "verified",
    sourceIds: ["src-notice"],
  },
  contractVehicle: {
    value: null,
    state: "unknown",
    sourceIds: [],
  },
  periodOfPerformance: {
    value: null,
    state: "unknown",
    sourceIds: [],
  },
  attachments: {
    value: [],
    state: "unknown",
    sourceIds: [],
  },
  fetchedAt: now,
  highlights: [
    "The Army is seeking ICAM and dynamic access-control technologies at TRL 6 or higher.",
    "Solutions should support tactical use in limited-bandwidth, high-latency, and resource-constrained environments.",
    "ICAM is described as the foundation for cybersecurity across people and non-person entities.",
  ],
  rawText:
    "SOURCES SOUGHT NOTICE — The U.S. Army C5ISR Center is surveying the market for policy-driven Identity, Credential, and Access Management and dynamic access-control solutions. Proposed technologies should be at TRL 6 or higher and support resource-constrained tactical environments.",
};

export const DEMO_BRIEF: CaptureBrief = {
  executiveSummary:
    "Exa confirmed that this Army ICAM notice is inactive. The technical fit is strong, but the opportunity is not actionable; CaptureBrief prevents the team from spending capture hours on an expired market-research notice while preserving the evidence for a future follow-on.",
  strongestReasons: [
    "ICAM is the primary scope rather than a subordinate requirement.",
    "Identity, credential, and access management is the explicit core problem.",
    "The work connects enterprise identity to tactical dynamic-access decisions and Zero Trust outcomes.",
  ],
  largestRisks: [
    "The live status, response date, and eventual acquisition path must be confirmed.",
    "Public evidence does not reliably identify the incumbent.",
    "A sources-sought response must shape the acquisition rather than assume an RFP will follow unchanged.",
  ],
  gates: [
    {
      id: "scope",
      label: "Identity is core scope",
      state: "pass",
      explanation:
        "The notice explicitly seeks ICAM and dynamic access-control solutions for Army tactical environments.",
      sourceIds: ["src-notice"],
      hardGate: true,
    },
    {
      id: "access",
      label: "Contract access",
      state: "unclear",
      explanation:
        "The Government has not selected a contract vehicle or final competition strategy.",
      sourceIds: ["src-notice"],
      hardGate: true,
    },
    {
      id: "compliance",
      label: "Compliance attainable",
      state: "pass",
      explanation:
        "Federal identity standards align, but the team must validate the requested tactical TRL and operating constraints.",
      sourceIds: ["src-notice", "src-nist"],
      hardGate: true,
    },
    {
      id: "window",
      label: "Opportunity actionable",
      state: "fail",
      explanation:
        "The official SAM.gov record is inactive, so this notice cannot support a current pursuit.",
      sourceIds: ["src-notice"],
      hardGate: true,
    },
    {
      id: "strategic",
      label: "Strategic alignment",
      state: "pass",
      explanation:
        "The scope aligns with reusable ICAM capabilities and federal Zero Trust priorities.",
      sourceIds: ["src-cisa", "src-budget"],
      hardGate: false,
    },
  ],
  sections: [
    {
      id: "requirements",
      title: "Requirements",
      summary:
        "The Army is testing market capacity for ICAM and dynamic access control in tactical, resource-constrained settings.",
      facts: [
        {
          label: "Core outcome",
          value: "ICAM and dynamic access control",
          state: "verified",
          sourceIds: ["src-notice"],
        },
        {
          label: "Authentication",
          value: "Policy-driven identity and access decisions",
          state: "verified",
          sourceIds: ["src-notice"],
        },
      ],
    },
    {
      id: "agency",
      title: "Agency context",
      summary:
        "The Army frames ICAM as a cybersecurity foundation, consistent with federal Zero Trust identity priorities.",
      facts: [
        {
          label: "Strategic driver",
          value: "Federal Zero Trust identity pillar",
          state: "verified",
          sourceIds: ["src-cisa"],
        },
      ],
    },
    {
      id: "funding",
      title: "Funding",
      summary:
        "Official Army budget materials provide portfolio context, but no notice-level funding amount is verified.",
      facts: [
        {
          label: "Program funding",
          value: "Portfolio context available; notice-level amount unknown",
          state: "inference",
          sourceIds: ["src-budget"],
        },
      ],
    },
    {
      id: "acquisition",
      title: "Acquisition history",
      summary:
        "Related federal identity services awards exist, but the notice does not confirm the vehicle or incumbent.",
      facts: [
        {
          label: "Incumbent",
          value: "Not confirmed",
          state: "unknown",
          sourceIds: [],
        },
      ],
    },
    {
      id: "fit",
      title: "Contractor fit",
      summary:
        "Technical fit is strong; acquisition access must be resolved before a full pursuit commitment.",
      facts: [
        {
          label: "Capability overlap",
          value: "ICAM, MFA, lifecycle, PAM, Zero Trust",
          state: "verified",
          sourceIds: ["src-notice"],
        },
      ],
    },
  ],
  unknowns: [
    "Current notice status, response deadline, and notice identifier",
    "Final contract vehicle and competition type",
    "Confirmed incumbent and recompete status",
    "Estimated contract value",
  ],
  nextActions: [
    "Confirm the notice status and response window on SAM.gov.",
    "Prepare a capability position emphasizing tactical ICAM maturity and dynamic access control.",
    "Confirm likely vehicle and teaming path with the contracting office.",
    "Validate incumbent history using official award identifiers.",
  ],
  contractingOfficerQuestions: [
    "Which contract vehicles are under consideration?",
    "Will the Government require FedRAMP High authorization for all cloud components?",
    "Is an organizational conflict-of-interest mitigation plan anticipated?",
  ],
  readiness: "blocked",
  readinessReason: "Official notice is inactive",
  groundingConfidence: "high",
  generatedAt: now,
};

export const DEMO_WORKSTREAMS: ResearchWorkstream[] = [
  {
    id: "notice",
    label: "Notice",
    status: "complete",
    detail: "Live notice and attachments parsed",
    sourceCount: 1,
  },
  {
    id: "strategy",
    label: "Agency strategy",
    status: "complete",
    detail: "Zero Trust and ICAM priorities found",
    sourceCount: 2,
  },
  {
    id: "budget",
    label: "Budget",
    status: "complete",
    detail: "Portfolio funding signal found",
    sourceCount: 1,
  },
  {
    id: "acquisition",
    label: "Acquisition",
    status: "complete",
    detail: "Related awards researched",
    sourceCount: 1,
  },
  {
    id: "synthesis",
    label: "Capture brief",
    status: "complete",
    detail: "Five gates assessed",
    sourceCount: 5,
  },
];

export const DEMO_TRACE: TraceEvent[] = [
  {
    id: "trace-1",
    kind: "fetch",
    workstream: "notice",
    text: "Fetched current SAM.gov notice",
    url: DEMO_SOURCES[0].url,
    domain: "sam.gov",
    at: 300,
  },
  {
    id: "trace-2",
    kind: "search",
    workstream: "strategy",
    text: "Searching agency ICAM and Zero Trust priorities",
    url: null,
    domain: null,
    at: 900,
  },
  {
    id: "trace-3",
    kind: "source",
    workstream: "strategy",
    text: "Federal Zero Trust Strategy",
    url: DEMO_SOURCES[1].url,
    domain: "cisa.gov",
    at: 1500,
  },
  {
    id: "trace-4",
    kind: "source",
    workstream: "budget",
    text: "Congressional budget justification",
    url: DEMO_SOURCES[3].url,
    domain: "dhs.gov",
    at: 2200,
  },
  {
    id: "trace-5",
    kind: "source",
    workstream: "acquisition",
    text: "Related award history",
    url: DEMO_SOURCES[4].url,
    domain: "usaspending.gov",
    at: 3000,
  },
  {
    id: "trace-6",
    kind: "done",
    workstream: "synthesis",
    text: "Capture brief complete",
    url: null,
    domain: null,
    at: 4200,
  },
];

export const DEMO_STATS: RunStats = {
  runId: "agent_run_demo_federal",
  effort: "low",
  elapsedMs: 38_400,
  sourcesSeen: 18,
  searches: 7,
  fetches: 6,
  costTotal: 0.025,
  stopReason: "schema_satisfied",
};

export const DEMO_QUESTION: BriefQuestion = {
  id: "question-demo",
  question: "Is FedRAMP High explicitly required?",
  answer:
    "The current sources-sought notice does not explicitly require FedRAMP High. It references federal cloud security requirements, so the impact level should be confirmed with the contracting office.",
  citations: [DEMO_SOURCES[0], DEMO_SOURCES[2]],
  createdAt: now,
  mode: "answer",
};

export const DEMO_UPDATE: PursuitUpdate = {
  id: "update-demo",
  type: "amendment",
  title: "Amendment / status signal detected",
  description:
    "Exa found a material change signal against the watched SAM.gov notice — review the official source before capture spend.",
  detectedAt: "2026-08-06T14:20:00.000Z",
  source: DEMO_SOURCES[0],
  read: false,
};

export const DEMO_PURSUIT: Pursuit = {
  id: "pursuit-demo",
  name: "ICAM and Dynamic Access Control Solutions",
  snapshot: DEMO_SNAPSHOT,
  profile: FEDERAL_IDENTITY_PROFILE,
  sources: DEMO_SOURCES,
  brief: DEMO_BRIEF,
  decision: null,
  decisionActions: [],
  trace: DEMO_TRACE,
  workstreams: DEMO_WORKSTREAMS,
  stats: DEMO_STATS,
  questions: [DEMO_QUESTION],
  monitor: null,
  updates: [],
  createdAt: now,
  updatedAt: now,
};
