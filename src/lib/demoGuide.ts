export type DemoExample = {
  label: string;
  url: string;
  agency: string;
  why: string;
  expected: string;
  intake: boolean;
};

export type ExaStep = {
  step: string;
  when: string;
  api: string;
  what: string;
  detail: string;
};

export const DEMO_EXAMPLES: DemoExample[] = [
  {
    label: "Army ICAM Sources Sought (golden path)",
    url: "https://sam.gov/opp/887384ceab80465193079e1a6c477513/view",
    agency: "U.S. Army C5ISR",
    why: "Primary interview demo — inactive notice that should block readiness.",
    expected:
      "Exa Contents + Search + Agent → readiness blocked on opportunity window. Pass / Hold show disposition value.",
    intake: true,
  },
  {
    label: "Air Force DAF ICAM Enterprise III RFI",
    url: "https://sam.gov/opp/b794268b40264083bd406939b11861cb/view",
    agency: "Department of the Air Force",
    why: "Active-style ICAM market research with attachments — good live Contents test.",
    expected:
      "exa.getContents pulls notice + highlights; research may surface Zero Trust / ICAM strategy evidence.",
    intake: true,
  },
  {
    label: "Army T-ICAM software licensing RFI",
    url: "https://sam.gov/opp/5455d8cef2cb4cfebc3bf831d3da29c6/view",
    agency: "U.S. Army",
    why: "Tactical ICAM / DDIL focus — close ICP fit for Meridian Federal.",
    expected:
      "Strong scope gate; access / window gates depend on live status Exa reads from the notice.",
    intake: true,
  },
  {
    label: "Army E-ICAM sustainment support",
    url: "https://sam.gov/opp/0af06cc09f6443269395839a453d3c81/view",
    agency: "U.S. Army PEO C3N",
    why: "Enterprise ICAM services language — useful acquisition-history contrast.",
    expected:
      "Exa Search acquisition workstream may find related USASpending / SAM award context.",
    intake: true,
  },
  {
    label: "DISA DoD E-ICAM audit sources sought",
    url: "https://sam.gov/opp/920dc69e8d674c7bb450934b14082d0a/view",
    agency: "DISA",
    why: "ICAM-adjacent services notice — tests whether scope gate stays honest.",
    expected:
      "May pass strategic alignment but fail / unclear on core identity product fit.",
    intake: true,
  },
];

export const EXA_STEPS: ExaStep[] = [
  {
    step: "01 · Intake",
    when: "You paste a SAM.gov / .gov notice and click Review notice",
    api: "exa.getContents([url])",
    what: "Live-crawl the official notice page",
    detail:
      "Exa fetches the notice text + targeted highlights (agency, solicitation number, deadline, NAICS, PSC, set-aside, vehicle, requirements). If the crawl is thin, CaptureBrief falls back to exa.search on sam.gov with contents/highlights to recover the indexed record.",
  },
  {
    step: "02 · Controlled search",
    when: "After intake, when research / Build brief starts",
    api: "exa.search (×3 workstreams)",
    what: "Pull agency strategy, budget, and acquisition history",
    detail:
      "Three domain-scoped searches: strategy (cisa.gov, whitehouse.gov, gsa.gov), budget (govinfo.gov, congress.gov), acquisition (usaspending.gov, sam.gov, fpds.gov, gsa.gov). Each returns results with highlights so CaptureBrief can cite official evidence before synthesis.",
  },
  {
    step: "03 · Capture Agent",
    when: "During live research / deepen follow-ups",
    api: "exa.agent.runs.create({ stream: true, outputSchema })",
    what: "Produce a structured, cited capture brief",
    detail:
      "The Agent receives the notice snapshot, contractor ICP, and collected evidence, then streams search/contents tool traces. It returns a schema-constrained brief (gates, facts with verified/inference/unknown, unknowns, next actions). The app — not the model — derives readiness from hard gates.",
  },
  {
    step: "04 · Grounded Ask",
    when: "You ask a question on the Intelligence case",
    api: "exa.answer(question)",
    what: "Fast, citation-backed clarification",
    detail:
      "Exa Answer responds only from public web evidence and returns citations. Used for quick CO / compliance questions without re-running the full Agent.",
  },
  {
    step: "05 · Deepen",
    when: "You deepen a question from Ask",
    api: "exa.agent.runs.create({ previousRunId, followup })",
    what: "Continue the prior Agent run with a follow-up",
    detail:
      "Reuses previousRunId so Exa continues the same research thread instead of starting cold. Streams additional tool use and updates the brief.",
  },
  {
    step: "06 · Arm monitor",
    when: "Watch, Pursue, or Hold",
    api: "exa.monitors.create (when APP_URL is public HTTPS)",
    what: "Subscribe to recurring change detection",
    detail:
      "Creates an Exa Monitor over the solicitation with interval trigger + webhook. Locally without a public HTTPS APP_URL, CaptureBrief still arms an active watch and uses live checks (step 07) so the Monitoring desk stays real-time.",
  },
  {
    step: "07 · Live change check",
    when: "Immediately after Watch / on Check now / every ~45s",
    api: "exa.search(… amendment OR deadline OR attachment …)",
    what: "Scan SAM.gov for material deltas now",
    detail:
      "Runs a fresh Exa Search scoped to sam.gov with highlights for amendments, response dates, attachments, cancellations, and awards. Results become Material change feed items with source URLs.",
  },
  {
    step: "08 · Webhook delivery",
    when: "Deployed demo with APP_URL=https://…",
    api: "Exa Monitor webhook → /api/capture/monitor/webhook",
    what: "Signed monitor.run.completed events",
    detail:
      "Exa POSTs signed payloads when a monitor run finishes. CaptureBrief verifies the signature, dedupes changes, and appends unread updates to the watched pursuit.",
  },
  {
    step: "09 · Human decision",
    when: "Pursue / Hold / Pass",
    api: "App workflow (may call steps 06–07)",
    what: "Turn gates into capture actions",
    detail:
      "Pursue: start watch + handoff packet + live check + open Monitoring. Hold: pin unresolved gates + keep watch. Pass: file no-bid disposition from blocking evidence. Exa does not make the bid decision — the human does.",
  },
];
