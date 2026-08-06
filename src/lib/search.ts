import { getExa } from "./exa";
import { CAPTURE_BRIEF_SCHEMA, buildCaptureQuery } from "./schema";
import {
  classifyAuthority,
  hostname,
  normalizeCaptureBrief,
  record,
  stringValue,
} from "./normalize";
import type {
  ContractorProfile,
  Effort,
  EvidenceSource,
  NoticeSnapshot,
  ResearchResult,
  ResearchWorkstream,
  TraceEvent,
} from "./types";

type WorkstreamId = ResearchWorkstream["id"];

export type ResearchOptions = {
  snapshot: NoticeSnapshot;
  profile: ContractorProfile;
  noticeSources: EvidenceSource[];
  effort: Effort;
  previousRunId?: string;
  followup?: string;
};

export type ResearchProgress =
  | { type: "workstream"; workstream: ResearchWorkstream }
  | { type: "trace"; event: TraceEvent }
  | { type: "done"; result: ResearchResult }
  | { type: "error"; message: string };

const SEARCH_PLANS: Array<{
  id: Exclude<WorkstreamId, "notice" | "synthesis">;
  label: string;
  category: EvidenceSource["category"];
  query: (snapshot: NoticeSnapshot) => string;
  domains: string[];
}> = [
  {
    id: "strategy",
    label: "Agency strategy",
    category: "strategy",
    query: (snapshot) =>
      `${snapshot.agency.value ?? "federal agency"} ICAM identity Zero Trust cybersecurity strategy modernization`,
    domains: ["cisa.gov", "whitehouse.gov", "gsa.gov"],
  },
  {
    id: "budget",
    label: "Budget",
    category: "budget",
    query: (snapshot) =>
      `${snapshot.agency.value ?? "federal agency"} congressional budget justification identity cybersecurity modernization`,
    domains: ["govinfo.gov", "congress.gov"],
  },
  {
    id: "acquisition",
    label: "Acquisition history",
    category: "acquisition",
    query: (snapshot) =>
      `${snapshot.agency.value ?? "federal agency"} ${snapshot.title.value ?? "identity services"} prior contract award incumbent`,
    domains: ["usaspending.gov", "sam.gov", "fpds.gov", "gsa.gov"],
  },
];

function sourceFromResult(
  raw: unknown,
  category: EvidenceSource["category"],
  index: number,
): EvidenceSource | null {
  const result = record(raw);
  const url = stringValue(result.url);
  if (!url) return null;
  const highlights = Array.isArray(result.highlights)
    ? result.highlights.filter(
        (highlight): highlight is string => typeof highlight === "string",
      )
    : [];
  return {
    id: `src-${category}-${index}-${hostname(url)}`,
    title: stringValue(result.title) ?? url,
    url,
    domain: hostname(url),
    authority: classifyAuthority(url),
    category,
    excerpt: highlights[0] ?? stringValue(result.summary),
    retrievedAt: new Date().toISOString(),
  };
}

export async function collectFederalEvidence(
  snapshot: NoticeSnapshot,
  onWorkstream?: (workstream: ResearchWorkstream) => void,
): Promise<EvidenceSource[]> {
  const exa = getExa();
  const collected: EvidenceSource[] = [];

  await Promise.all(
    SEARCH_PLANS.map(async (plan) => {
      onWorkstream?.({
        id: plan.id,
        label: plan.label,
        status: "active",
        detail: "Searching official federal sources",
        sourceCount: 0,
      });
      try {
        const response = await exa.search(plan.query(snapshot), {
          type: "auto",
          numResults: 4,
          includeDomains: plan.domains,
          contents: {
            highlights: {
              query:
                "identity cybersecurity requirement strategy funding award vehicle incumbent evidence",
              maxCharacters: 2_500,
            },
          },
        });
        const sources = response.results
          .map((result, index) =>
            sourceFromResult(result, plan.category, index),
          )
          .filter((source): source is EvidenceSource => Boolean(source));
        collected.push(...sources);
        onWorkstream?.({
          id: plan.id,
          label: plan.label,
          status: "complete",
          detail:
            sources.length > 0
              ? `${sources.length} supporting sources`
              : "No official source found",
          sourceCount: sources.length,
        });
      } catch {
        onWorkstream?.({
          id: plan.id,
          label: plan.label,
          status: "failed",
          detail: "Search unavailable",
          sourceCount: 0,
        });
      }
    }),
  );

  return collected;
}

function workstreamForText(text: string): WorkstreamId {
  const token = text.toLowerCase();
  if (token.includes("budget") || token.includes("fund")) return "budget";
  if (
    token.includes("award") ||
    token.includes("incumbent") ||
    token.includes("contract")
  ) {
    return "acquisition";
  }
  if (
    token.includes("agency") ||
    token.includes("strategy") ||
    token.includes("zero trust")
  ) {
    return "strategy";
  }
  return "synthesis";
}

export async function* streamCaptureResearch(
  options: ResearchOptions,
): AsyncGenerator<ResearchProgress> {
  const exa = getExa();
  const started = Date.now();
  let sequence = 0;

  const trace = (
    kind: TraceEvent["kind"],
    workstream: WorkstreamId,
    text: string,
    url: string | null = null,
  ): ResearchProgress => ({
    type: "trace",
    event: {
      id: `trace-${sequence++}`,
      kind,
      workstream,
      text,
      url,
      domain: url ? hostname(url) : null,
      at: Date.now() - started,
    },
  });

  yield {
    type: "workstream",
    workstream: {
      id: "notice",
      label: "Notice",
      status: "complete",
      detail: "Live notice parsed",
      sourceCount: options.noticeSources.length,
    },
  };
  yield trace(
    "fetch",
    "notice",
    "Parsed current federal notice",
    options.snapshot.sourceUrl,
  );

  const queued: ResearchWorkstream[] = [];
  const evidence = await collectFederalEvidence(
    options.snapshot,
    (workstream) => queued.push(workstream),
  );
  for (const workstream of queued) {
    yield { type: "workstream", workstream };
    if (workstream.status === "complete") {
      for (const source of evidence.filter(
        (item) =>
          (workstream.id === "strategy" && item.category === "strategy") ||
          (workstream.id === "budget" && item.category === "budget") ||
          (workstream.id === "acquisition" &&
            item.category === "acquisition"),
      )) {
        yield trace(
          "source",
          workstream.id,
          source.title,
          source.url,
        );
      }
    }
  }

  const sources = [...options.noticeSources, ...evidence];
  yield {
    type: "workstream",
    workstream: {
      id: "synthesis",
      label: "Capture brief",
      status: "active",
      detail: "Agent researching and verifying",
      sourceCount: sources.length,
    },
  };

  try {
    const events = await exa.agent.runs.create({
      query: options.followup
        ? `Continue the prior capture research. ${options.followup}`
        : buildCaptureQuery(options.snapshot, options.profile, sources),
      input: {
        data: [
          {
            notice: options.snapshot,
            contractor: options.profile,
            evidence: sources,
          },
        ],
      },
      outputSchema: CAPTURE_BRIEF_SCHEMA,
      effort: options.effort,
      ...(options.previousRunId
        ? { previousRunId: options.previousRunId }
        : {}),
      metadata: {
        app: "capturebrief",
        profile: options.profile.id,
        solicitation: options.snapshot.solicitationNumber.value ?? "unknown",
      },
      stream: true,
    });

    let sourcesSeen = sources.length;
    let searches = SEARCH_PLANS.length;
    let fetches = 1;

    for await (const raw of events as AsyncIterable<{
      event?: string;
      data?: unknown;
    }>) {
      const name = raw.event ?? "";
      const data = record(raw.data);

      if (name === "agent_run.search_trace") {
        const text = stringValue(data.text);
        if (text) {
          searches += stringValue(data.tool) === "search" ? 1 : 0;
          fetches += stringValue(data.tool) === "contents" ? 1 : 0;
          yield trace(
            stringValue(data.tool) === "contents" ? "fetch" : "search",
            workstreamForText(text),
            text,
          );
        }
      }

      if (name === "agent_run.source.added") {
        const sourceRecord = record(data.source);
        const url = stringValue(sourceRecord.url);
        if (url) {
          const category = workstreamForText(
            `${stringValue(sourceRecord.title) ?? ""} ${url}`,
          );
          const source: EvidenceSource = {
            id: `src-agent-${sourcesSeen}-${hostname(url)}`,
            title: stringValue(sourceRecord.title) ?? url,
            url,
            domain: hostname(url),
            authority: classifyAuthority(url),
            category:
              category === "budget" ||
              category === "acquisition" ||
              category === "strategy"
                ? category
                : "mandate",
            excerpt: null,
            retrievedAt: new Date().toISOString(),
          };
          if (!sources.some((item) => item.url === url)) sources.push(source);
          sourcesSeen += 1;
          yield trace("source", category, source.title, url);
        }
      }

      if (name === "agent_run.completed") {
        const output = data.output as unknown;
        const cost = record(data.costDollars);
        const usage = record(data.usage);
        const brief = normalizeCaptureBrief(output, sources);
        yield {
          type: "workstream",
          workstream: {
            id: "synthesis",
            label: "Capture brief",
            status: "complete",
            detail: "Evidence-backed brief ready",
            sourceCount: sources.length,
          },
        };
        yield trace("done", "synthesis", "Capture brief complete");
        yield {
          type: "done",
          result: {
            brief,
            sources,
            stats: {
              runId: stringValue(data.id),
              effort: options.effort,
              elapsedMs: Date.now() - started,
              sourcesSeen: sources.length,
              searches:
                typeof usage.numSearches === "number"
                  ? usage.numSearches + SEARCH_PLANS.length
                  : searches,
              fetches:
                typeof usage.numFetches === "number"
                  ? usage.numFetches + 1
                  : fetches,
              costTotal:
                typeof cost.total === "number" ? cost.total : null,
              stopReason: stringValue(data.stopReason),
            },
          },
        };
        return;
      }

      if (name === "agent_run.failed" || name === "agent_run.cancelled") {
        yield {
          type: "error",
          message:
            stringValue(record(data.error).message) ??
            `Agent run ${name.split(".")[1]}`,
        };
        return;
      }
    }
  } catch (error) {
    yield {
      type: "error",
      message:
        error instanceof Error ? error.message : "Federal research failed",
    };
  }
}
