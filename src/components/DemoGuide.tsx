"use client";

import { DEMO_EXAMPLES, EXA_STEPS } from "@/lib/demoGuide";

export default function DemoGuide({
  open,
  onClose,
  onUseExample,
}: {
  open: boolean;
  onClose: () => void;
  onUseExample: (url: string) => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-ink/30 backdrop-blur-[2px]">
      <button
        aria-label="Close demo guide"
        className="min-w-0 flex-1"
        onClick={onClose}
      />
      <aside className="flex h-full w-full max-w-xl flex-col border-l border-line bg-raised shadow-[-18px_0_50px_rgba(16,24,40,0.12)]">
        <header className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold text-accent">
              Demo walkthrough
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-[-0.02em] text-ink">
              What is happening — and where Exa runs
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-inksoft">
              Every CaptureBrief stage maps to a specific Exa API. The human
              still owns Pursue / Hold / Pass.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md border border-line px-2.5 py-1.5 text-[10px] font-semibold text-inksoft"
          >
            Close
          </button>
        </header>

        <div className="scroll-quiet min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <section>
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-inkfaint">
              Example notices
            </p>
            <p className="mt-1 text-[11px] text-inksoft">
              Click Use to load an intake-ready SAM.gov URL into the demo.
            </p>
            <div className="mt-3 space-y-3">
              {DEMO_EXAMPLES.map((example) => (
                <article
                  key={example.url}
                  className="rounded-xl border border-line bg-surface px-3.5 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[12px] font-semibold text-ink">
                        {example.label}
                      </p>
                      <p className="mt-0.5 text-[10px] text-inkfaint">
                        {example.agency}
                      </p>
                    </div>
                    {example.intake && (
                      <button
                        onClick={() => onUseExample(example.url)}
                        className="shrink-0 rounded-md bg-accent px-2.5 py-1 text-[10px] font-semibold text-white"
                      >
                        Use
                      </button>
                    )}
                  </div>
                  <p className="mt-2 text-[10px] leading-relaxed text-inksoft">
                    {example.why}
                  </p>
                  <p className="mt-1.5 text-[10px] leading-relaxed text-ink">
                    <span className="font-semibold">Expect: </span>
                    {example.expected}
                  </p>
                  <a
                    href={example.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 block truncate font-mono text-[9px] text-accent hover:underline"
                  >
                    {example.url}
                  </a>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-8">
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-inkfaint">
              Exa usage by stage
            </p>
            <ol className="mt-3 space-y-3">
              {EXA_STEPS.map((item) => (
                <li
                  key={item.step}
                  className="rounded-xl border border-line bg-surface px-3.5 py-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[12px] font-semibold text-ink">
                      {item.step}
                    </p>
                    <code className="rounded bg-paper px-1.5 py-0.5 font-mono text-[9px] text-accent">
                      {item.api}
                    </code>
                  </div>
                  <p className="mt-2 text-[10px] font-semibold text-inksoft">
                    When: {item.when}
                  </p>
                  <p className="mt-1 text-[11px] font-semibold text-ink">
                    {item.what}
                  </p>
                  <p className="mt-1.5 text-[10px] leading-relaxed text-inksoft">
                    {item.detail}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </aside>
    </div>
  );
}
