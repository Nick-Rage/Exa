export type EvidenceState = "verified" | "inference" | "unknown";
export type GateState = "pass" | "fail" | "unclear";
export type Readiness = "ready" | "review" | "blocked";
export type HumanDecision = "pursue" | "hold" | "pass";
export type Effort = "low" | "medium" | "high";

export const EFFORT_COST: Record<Effort, number> = {
  low: 0.025,
  medium: 0.1,
  high: 0.5,
};

export type EvidenceSource = {
  id: string;
  title: string;
  url: string;
  domain: string;
  authority: "official" | "authoritative" | "secondary";
  category: "notice" | "strategy" | "budget" | "acquisition" | "mandate";
  excerpt: string | null;
  retrievedAt: string;
};

export type SupportedValue<T = string> = {
  value: T | null;
  state: EvidenceState;
  sourceIds: string[];
};

export type NoticeSnapshot = {
  sourceUrl: string;
  title: SupportedValue;
  agency: SupportedValue;
  office: SupportedValue;
  solicitationNumber: SupportedValue;
  noticeType: SupportedValue;
  status: SupportedValue;
  responseDeadline: SupportedValue;
  responseDeadlineIso: SupportedValue;
  amendmentDate: SupportedValue;
  naics: SupportedValue;
  psc: SupportedValue;
  setAside: SupportedValue;
  contractVehicle: SupportedValue;
  periodOfPerformance: SupportedValue;
  attachments: SupportedValue<string[]>;
  fetchedAt: string;
  highlights: string[];
  rawText: string;
};

export type ContractorProfile = {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  targetAgencies: string[];
  contractVehicles: string[];
  certifications: string[];
  socioeconomicStatus: string;
  hardDisqualifiers: string[];
};

export type GateAssessment = {
  id: string;
  label: string;
  state: GateState;
  explanation: string;
  sourceIds: string[];
  hardGate: boolean;
};

export type BriefSection = {
  id: "requirements" | "agency" | "funding" | "acquisition" | "fit";
  title: string;
  summary: string;
  facts: Array<{
    label: string;
    value: string;
    state: EvidenceState;
    sourceIds: string[];
  }>;
};

export type CaptureBrief = {
  executiveSummary: string;
  strongestReasons: string[];
  largestRisks: string[];
  gates: GateAssessment[];
  sections: BriefSection[];
  unknowns: string[];
  nextActions: string[];
  contractingOfficerQuestions: string[];
  readiness: Readiness;
  readinessReason: string;
  groundingConfidence: "low" | "medium" | "high" | null;
  generatedAt: string;
};

export type ResearchWorkstream = {
  id: "notice" | "strategy" | "budget" | "acquisition" | "synthesis";
  label: string;
  status: "pending" | "active" | "complete" | "failed";
  detail: string;
  sourceCount: number;
};

export type TraceEvent = {
  id: string;
  kind: "status" | "search" | "fetch" | "source" | "done";
  workstream: ResearchWorkstream["id"];
  text: string;
  url: string | null;
  domain: string | null;
  at: number;
};

export type RunStats = {
  runId: string | null;
  effort: Effort;
  elapsedMs: number;
  sourcesSeen: number;
  searches: number;
  fetches: number;
  costTotal: number | null;
  stopReason: string | null;
};

export type BriefQuestion = {
  id: string;
  question: string;
  answer: string;
  citations: EvidenceSource[];
  createdAt: string;
  mode: "answer" | "agent";
};

export type PursuitUpdate = {
  id: string;
  type: "deadline" | "attachment" | "status" | "amendment" | "signal";
  title: string;
  description: string;
  detectedAt: string;
  source: EvidenceSource;
  read: boolean;
};

export type MonitorSubscription = {
  id: string;
  status: "active" | "paused" | "demo";
  createdAt: string;
  nextRunAt: string | null;
  lastCheckedAt?: string | null;
  checking?: boolean;
};

export type DecisionAction = {
  id: string;
  decision: HumanDecision;
  title: string;
  detail: string;
  createdAt: string;
  status: "done" | "running" | "queued";
};

export type Pursuit = {
  id: string;
  name: string;
  snapshot: NoticeSnapshot;
  profile: ContractorProfile;
  sources: EvidenceSource[];
  brief: CaptureBrief | null;
  decision: HumanDecision | null;
  decisionActions: DecisionAction[];
  trace: TraceEvent[];
  workstreams: ResearchWorkstream[];
  stats: RunStats | null;
  questions: BriefQuestion[];
  monitor: MonitorSubscription | null;
  updates: PursuitUpdate[];
  createdAt: string;
  updatedAt: string;
};

export type ResearchResult = {
  brief: CaptureBrief;
  sources: EvidenceSource[];
  stats: RunStats;
};
