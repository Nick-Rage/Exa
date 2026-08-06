import type {
  DecisionAction,
  HumanDecision,
  NoticeSnapshot,
} from "@/lib/types";

export function buildDecisionActions(
  decision: HumanDecision,
  snapshot: NoticeSnapshot,
): DecisionAction[] {
  const createdAt = new Date().toISOString();
  const notice =
    snapshot.solicitationNumber.value ??
    snapshot.title.value ??
    "this opportunity";

  if (decision === "pursue") {
    return [
      {
        id: `act-${Date.now()}-1`,
        decision,
        title: "Capture watch started",
        detail: `Exa is monitoring ${notice} for amendments, deadline shifts, and attachment changes.`,
        createdAt,
        status: "done",
      },
      {
        id: `act-${Date.now()}-2`,
        decision,
        title: "Handoff packet assembled",
        detail:
          "Gate outcomes, official citations, and unanswered CO questions packaged for BD / proposal lead review.",
        createdAt,
        status: "done",
      },
      {
        id: `act-${Date.now()}-3`,
        decision,
        title: "Live change check queued",
        detail:
          "Immediate Exa scan of SAM.gov and related federal sources for material deltas.",
        createdAt,
        status: "running",
      },
    ];
  }

  if (decision === "hold") {
    return [
      {
        id: `act-${Date.now()}-1`,
        decision,
        title: "Hold disposition recorded",
        detail:
          "Case stays open until hard-gate gaps (access / window / compliance) are resolved.",
        createdAt,
        status: "done",
      },
      {
        id: `act-${Date.now()}-2`,
        decision,
        title: "Unresolved checklist pinned",
        detail:
          "Confirm vehicle path, response window, and incumbent history before any bid spend.",
        createdAt,
        status: "done",
      },
      {
        id: `act-${Date.now()}-3`,
        decision,
        title: "Watch kept active",
        detail:
          "Exa continues scanning so a later amendment can reopen the case without restarting research.",
        createdAt,
        status: "running",
      },
    ];
  }

  return [
    {
      id: `act-${Date.now()}-1`,
      decision,
      title: "Pass disposition filed",
      detail:
        "Evidence preserved that the notice is not actionable — avoids wasted capture hours.",
      createdAt,
      status: "done",
    },
    {
      id: `act-${Date.now()}-2`,
      decision,
      title: "No-bid memo drafted",
      detail: `Primary blocker: ${snapshot.status.value ?? "opportunity window closed or unverified"}. Fit notes retained for a future follow-on.`,
      createdAt,
      status: "done",
    },
    {
      id: `act-${Date.now()}-3`,
      decision,
      title: "Archived to disposition log",
      detail:
        "Case removed from active capture load; monitoring optional if a recompete appears.",
      createdAt,
      status: "done",
    },
  ];
}
