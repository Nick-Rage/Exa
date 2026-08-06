import { NextResponse } from "next/server";
import { hasExaKey, isForcedDemoMode } from "@/lib/exa";
import { demoIntake, intakeNotice, isAllowedNoticeUrl } from "@/lib/intake";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const url = typeof body?.url === "string" ? body.url.trim() : "";

  if (!isAllowedNoticeUrl(url)) {
    return NextResponse.json(
      { error: "Enter an HTTPS SAM.gov, .gov, or .mil notice URL." },
      { status: 400 },
    );
  }

  if (isForcedDemoMode() || !hasExaKey()) {
    return NextResponse.json({ ...demoIntake(), demo: true });
  }

  try {
    const result = await intakeNotice(url);
    return NextResponse.json({
      ...result,
      demo: false,
      note: result.usedSearchFallback
        ? "Livecrawl was thin — used Exa Search fallback on sam.gov to recover the indexed notice."
        : undefined,
    });
  } catch (error) {
    return NextResponse.json({
      ...demoIntake(),
      demo: true,
      note:
        error instanceof Error
          ? `Live notice retrieval failed: ${error.message}. Loaded captured notice.`
          : "Live notice retrieval failed. Loaded captured notice.",
    });
  }
}
