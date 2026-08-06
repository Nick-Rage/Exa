"use client";

import { useState } from "react";
import type { BriefQuestion, NoticeSnapshot } from "@/lib/types";

export default function AskPanel({
  snapshot,
  questions,
  onQuestion,
  onDeepen,
  embedded = false,
}: {
  snapshot: NoticeSnapshot;
  questions: BriefQuestion[];
  onQuestion: (question: BriefQuestion) => void;
  onDeepen: (question: string) => void;
  embedded?: boolean;
}) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ask = async () => {
    const question = value.trim();
    if (!question) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/capture/answer", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question, snapshot }),
      });
      const body = (await response.json()) as {
        question?: BriefQuestion;
        error?: string;
      };
      if (!response.ok || !body.question) {
        throw new Error(body.error ?? "Answer failed");
      }
      onQuestion(body.question);
      setValue("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Answer failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      className={
        embedded ? "overflow-hidden" : "rounded-2xl border border-line bg-raised"
      }
    >
      {!embedded && (
        <header className="border-b border-line px-5 py-4">
          <p className="text-sm font-semibold text-ink">Ask about this pursuit</p>
          <p className="mt-0.5 text-xs text-inksoft">
            Fast, web-grounded answers from Exa
          </p>
        </header>
      )}

      {questions.length > 0 && (
        <div className={embedded ? "space-y-3" : "space-y-3 px-5 pt-4"}>
          {questions.map((item) => (
            <article
              key={item.id}
              className="rounded-xl border border-line bg-raised p-4"
            >
              <p className="text-sm font-semibold text-ink">{item.question}</p>
              <p className="mt-1 font-mono text-[9px] text-inkfaint">
                {item.mode === "answer" ? "Exa Answer" : "Agent follow-up"} ·{" "}
                {new Date(item.createdAt).toLocaleString()}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-inksoft">
                {item.answer}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {item.citations.map((citation) => (
                  <a
                    key={citation.url}
                    href={citation.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-md border border-line bg-raised px-2 py-1 font-mono text-[10px] text-accent hover:underline"
                  >
                    {citation.domain}
                  </a>
                ))}
                <button
                  onClick={() => onDeepen(item.question)}
                  className="ml-auto text-[11px] font-semibold text-inksoft hover:text-ink"
                >
                  Investigate deeply
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className={embedded ? "pt-4" : "p-5"}>
        <div className="flex gap-2">
          <input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void ask();
            }}
            placeholder="Is FedRAMP High explicitly required?"
            className="min-w-0 flex-1 rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none focus:border-accent"
          />
          <button
            onClick={() => void ask()}
            disabled={loading || !value.trim()}
            className="rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
          >
            {loading ? "Asking…" : "Ask"}
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-halt">{error}</p>}
      </div>
    </section>
  );
}
