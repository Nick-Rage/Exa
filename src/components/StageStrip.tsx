"use client";

const STAGES = [
  { id: "intake", label: "Intake" },
  { id: "research", label: "Research" },
  { id: "gates", label: "Gates" },
  { id: "decision", label: "Decision" },
  { id: "watch", label: "Watch" },
] as const;

export type DemoStageId = (typeof STAGES)[number]["id"];

export default function StageStrip({
  active,
}: {
  active: DemoStageId;
}) {
  const activeIndex = STAGES.findIndex((stage) => stage.id === active);

  return (
    <div className="border-b border-line bg-surface/80 px-5">
      <ol className="mx-auto flex h-9 max-w-[1600px] items-center gap-1 overflow-x-auto">
        {STAGES.map((stage, index) => {
          const state =
            index < activeIndex
              ? "done"
              : index === activeIndex
                ? "active"
                : "todo";
          return (
            <li key={stage.id} className="flex items-center gap-1">
              {index > 0 && (
                <span className="mx-1 h-px w-4 bg-line sm:w-6" />
              )}
              <span
                className={`whitespace-nowrap rounded-md px-2 py-1 text-[10px] font-semibold ${
                  state === "active"
                    ? "bg-accent text-white"
                    : state === "done"
                      ? "text-good"
                      : "text-inkfaint"
                }`}
              >
                {stage.label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
