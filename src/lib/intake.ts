import { getExa } from "./exa";
import { DEMO_SNAPSHOT, DEMO_SOURCES } from "./federalDemo";
import { classifyAuthority, hostname, record, stringValue } from "./normalize";
import type { EvidenceSource, NoticeSnapshot, SupportedValue } from "./types";

function supported(
  value: string | null,
  sourceId = "src-notice-live",
): SupportedValue {
  return {
    value,
    state: value ? "verified" : "unknown",
    sourceIds: value ? [sourceId] : [],
  };
}

function match(text: string, patterns: RegExp[]): string | null {
  for (const pattern of patterns) {
    const value = text.match(pattern)?.[1]?.trim();
    if (value) return value;
  }
  return null;
}

export function isAllowedNoticeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" &&
      (parsed.hostname === "sam.gov" ||
        parsed.hostname.endsWith(".sam.gov") ||
        parsed.hostname.endsWith(".gov") ||
        parsed.hostname.endsWith(".mil"))
    );
  } catch {
    return false;
  }
}

export async function intakeNotice(url: string): Promise<{
  snapshot: NoticeSnapshot;
  sources: EvidenceSource[];
  usedSearchFallback: boolean;
}> {
  const exa = getExa();
  const response = await exa.getContents([url], {
    text: { maxCharacters: 40_000 },
    highlights: {
      query:
        "agency solicitation number deadline notice type NAICS PSC set aside contract vehicle period of performance attachments identity cybersecurity requirements",
      maxCharacters: 8_000,
    },
    maxAgeHours: 0,
    livecrawlTimeout: 20_000,
  });

  let result = record(response.results?.[0]);
  let text = stringValue(result.text) ?? "";
  let usedSearchFallback = false;
  if (
    text.length < 500 ||
    (stringValue(result.title)?.toLowerCase() === "sam.gov" &&
      !/solicitation|sources sought|request for information/i.test(text))
  ) {
    usedSearchFallback = true;
    const noticeId = new URL(url).pathname
      .split("/")
      .find((part) => /^[a-f0-9]{32}$/i.test(part));
    const indexed = await exa.search(
      `${noticeId ?? url} federal opportunity notice`,
      {
        type: "auto",
        numResults: 3,
        includeDomains: ["sam.gov"],
        contents: {
          text: { maxCharacters: 40_000 },
          highlights: {
            query:
              "agency solicitation number deadline notice type NAICS PSC set aside contract vehicle period of performance requirements",
            maxCharacters: 8_000,
          },
        },
      },
    );
    result =
      indexed.results
        .map(record)
        .find((candidate) => stringValue(candidate.url) === url) ??
      record(indexed.results[0]);
    text = stringValue(result.text) ?? "";
  }
  const highlights = Array.isArray(result.highlights)
    ? result.highlights.filter(
        (highlight): highlight is string => typeof highlight === "string",
      )
    : [];
  const fetchedAt = new Date().toISOString();
  if (text.length < 500) {
    throw new Error(
      "The official notice did not expose enough public text to verify its fields.",
    );
  }
  const source: EvidenceSource = {
    id: "src-notice-live",
    title: stringValue(result.title) ?? "Federal opportunity notice",
    url,
    domain: hostname(url),
    authority: classifyAuthority(url),
    category: "notice",
    excerpt: highlights[0] ?? null,
    retrievedAt: fetchedAt,
  };

  const snapshot: NoticeSnapshot = {
    sourceUrl: url,
    title: supported(source.title),
    agency: supported(
      match(text, [
        /Department\/Ind\. Agency\s*[:\-]\s*([^\n]+)/i,
        /Department\/Ind\. Agency\s*\n+\s*([^\n]+)/i,
        /Agency\s*[:\-]\s*([^\n]+)/i,
      ]),
    ),
    office: supported(
      match(text, [
        /Office\s*[:\-]\s*([^\n]+)/i,
        /Contracting Office\s*[:\-]\s*([^\n]+)/i,
      ]),
    ),
    solicitationNumber: supported(
      match(text, [
        /Solicitation(?: Number| No\.?| ID)?\s*[:#\-]\s*([A-Z0-9._/-]+)/i,
        /Notice ID\s*[:#\-]\s*([A-Z0-9._/-]+)/i,
        /Notice ID\s*\n+\s*([A-Z0-9._/-]+)/i,
      ]),
    ),
    noticeType: supported(
      match(text, [
        /Notice Type\s*[:\-]\s*([^\n]+)/i,
        /\b(Sources Sought|Request for Information|Solicitation|Combined Synopsis\/Solicitation)\b/i,
      ]),
    ),
    status: supported(
      match(text, [/Status\s*[:\-]\s*([^\n]+)/i]) ?? "Active / verify notice",
    ),
    responseDeadline: supported(
      match(text, [
        /Response Date\s*[:\-]\s*([^\n]+)/i,
        /Response Deadline\s*[:\-]\s*([^\n]+)/i,
        /Due Date\s*[:\-]\s*([^\n]+)/i,
      ]),
    ),
    responseDeadlineIso: supported(null),
    amendmentDate: supported(
      match(text, [/Updated Date\s*[:\-]\s*([^\n]+)/i]),
    ),
    naics: supported(
      match(text, [
        /NAICS(?: Code)?\s*[:\-]\s*([^\n]+)/i,
        /NAICS(?: Code)?\s*:\s*\n+\s*([^\n]+)/i,
      ]),
    ),
    psc: supported(
      match(text, [/(?:PSC|Product Service Code)\s*[:\-]\s*([^\n]+)/i]),
    ),
    setAside: supported(
      match(text, [/(?:Set-Aside|Set Aside)\s*[:\-]\s*([^\n]+)/i]),
    ),
    contractVehicle: supported(
      match(text, [/Contract Vehicle\s*[:\-]\s*([^\n]+)/i]),
    ),
    periodOfPerformance: supported(
      match(text, [/Period of Performance\s*[:\-]\s*([^\n]+)/i]),
    ),
    attachments: {
      value: [],
      state: "unknown",
      sourceIds: [],
    },
    fetchedAt,
    highlights,
    rawText: text,
  };

  return { snapshot, sources: [source], usedSearchFallback };
}

export function demoIntake(): {
  snapshot: NoticeSnapshot;
  sources: EvidenceSource[];
  usedSearchFallback: boolean;
} {
  return {
    snapshot: DEMO_SNAPSHOT,
    sources: [DEMO_SOURCES[0]],
    usedSearchFallback: false,
  };
}
