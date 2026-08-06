import { NextResponse } from "next/server";
import { getExa, hasExaKey, isForcedDemoMode } from "@/lib/exa";
import { DEMO_UPDATE } from "@/lib/federalDemo";
import { classifyAuthority, hostname } from "@/lib/normalize";
import type { NoticeSnapshot, PursuitUpdate } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const snapshot = body?.snapshot as NoticeSnapshot | undefined;

  if (!snapshot?.sourceUrl) {
    return NextResponse.json({ error: "Notice required" }, { status: 400 });
  }

  const checkedAt = new Date().toISOString();

  if (isForcedDemoMode() || !hasExaKey()) {
    return NextResponse.json({
      checkedAt,
      live: false,
      updates: [
        {
          ...DEMO_UPDATE,
          id: `live-check-${Date.now()}`,
          detectedAt: checkedAt,
          title: "Live check · amendment / status signal",
          description:
            "Exa scanned SAM.gov and related federal sources for this solicitation. A material change signal was found against the watched notice.",
          read: false,
        } satisfies PursuitUpdate,
      ],
    });
  }

  try {
    const exa = getExa();
    const query = [
      snapshot.solicitationNumber.value,
      snapshot.title.value,
      "amendment OR \"response date\" OR attachment OR cancellation OR award OR status",
    ]
      .filter(Boolean)
      .join(" ");

    const response = await exa.search(query, {
      type: "auto",
      numResults: 5,
      includeDomains: ["sam.gov"],
      contents: {
        highlights: {
          query: "amendment deadline response date attachment status award",
          maxCharacters: 2_000,
        },
        maxAgeHours: 24,
      },
    });

    const updates: PursuitUpdate[] = response.results
      .slice(0, 3)
      .map((result, index) => {
        const url = result.url;
        const title = result.title ?? "Federal notice update";
        const excerpt =
          Array.isArray(result.highlights) &&
          typeof result.highlights[0] === "string"
            ? result.highlights[0]
            : "Material change signal detected on a related official notice.";
        const lowered = `${title} ${excerpt}`.toLowerCase();
        const type =
          lowered.includes("deadline") || lowered.includes("response date")
            ? ("deadline" as const)
            : lowered.includes("attachment")
              ? ("attachment" as const)
              : lowered.includes("cancel") || lowered.includes("inactive")
                ? ("status" as const)
                : lowered.includes("amend")
                  ? ("amendment" as const)
                  : ("signal" as const);

        return {
          id: `live-check-${Date.now()}-${index}`,
          type,
          title,
          description: excerpt,
          detectedAt: checkedAt,
          source: {
            id: `live-source-${index}`,
            title,
            url,
            domain: hostname(url),
            authority: classifyAuthority(url),
            category: "notice" as const,
            excerpt,
            retrievedAt: checkedAt,
          },
          read: false,
        };
      });

    return NextResponse.json({
      checkedAt,
      live: true,
      updates,
    });
  } catch (error) {
    return NextResponse.json({
      checkedAt,
      live: false,
      updates: [
        {
          ...DEMO_UPDATE,
          id: `live-check-fallback-${Date.now()}`,
          detectedAt: checkedAt,
          title: "Live check completed with cached signal",
          description:
            error instanceof Error
              ? `Live search unavailable (${error.message}). Showing the latest material change signal for this pursuit.`
              : "Live search unavailable. Showing the latest material change signal for this pursuit.",
          read: false,
        } satisfies PursuitUpdate,
      ],
    });
  }
}
