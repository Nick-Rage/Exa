import { NextResponse } from "next/server";
import { getExa, hasExaKey, isForcedDemoMode } from "@/lib/exa";
import { DEMO_QUESTION, DEMO_SNAPSHOT } from "@/lib/federalDemo";
import { classifyAuthority, hostname } from "@/lib/normalize";
import type { BriefQuestion, NoticeSnapshot } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const question =
    typeof body?.question === "string" ? body.question.trim() : "";
  const snapshot = body?.snapshot as NoticeSnapshot | undefined;

  if (!question || !snapshot?.sourceUrl) {
    return NextResponse.json(
      { error: "Question and notice required" },
      { status: 400 },
    );
  }

  if (isForcedDemoMode() || !hasExaKey()) {
    return NextResponse.json({
      question: { ...DEMO_QUESTION, question },
      demo: true,
    });
  }

  try {
    const exa = getExa();
    const response = await exa.answer(
      [
        question,
        `Federal opportunity: ${snapshot.title.value ?? "Unknown"}`,
        `Agency: ${snapshot.agency.value ?? "Unknown"}`,
        `Notice: ${snapshot.sourceUrl}`,
        "Answer only from public web evidence. State when the answer is not confirmed.",
      ].join("\n"),
      { text: true },
    );
    const item: BriefQuestion = {
      id: `question-${Date.now()}`,
      question,
      answer:
        typeof response.answer === "string"
          ? response.answer
          : JSON.stringify(response.answer),
      citations: (response.citations ?? []).map((citation, index) => ({
        id: `answer-source-${Date.now()}-${index}`,
        title: citation.title ?? citation.url,
        url: citation.url,
        domain: hostname(citation.url),
        authority: classifyAuthority(citation.url),
        category: "mandate" as const,
        excerpt: null,
        retrievedAt: new Date().toISOString(),
      })),
      createdAt: new Date().toISOString(),
      mode: "answer",
    };
    return NextResponse.json({ question: item, demo: false });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Grounded answer failed",
      },
      { status: 502 },
    );
  }
}
