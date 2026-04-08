import { FLState } from "@/lib/federated-learning";

interface WorkflowProgressProps {
  state: FLState;
}

const STEPS = [
  { id: "distributing", label: "Distribute" },
  { id: "local_training", label: "Train" },
  { id: "aggregating", label: "Aggregate" },
  { id: "evaluating", label: "Evaluate" },
];

export function WorkflowProgress({ state }: WorkflowProgressProps) {
  const activeIdx = STEPS.findIndex((s) => s.id === state.phase);
  const isComplete = state.phase === "complete";
  const isIdle = state.phase === "idle";

  return (
    <div className="flex items-center justify-center gap-1">
      {STEPS.map((step, i) => {
        const isActive = step.id === state.phase;
        const isPast = isComplete || (activeIdx >= 0 && i < activeIdx);
        return (
          <div key={step.id} className="flex items-center gap-1">
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-mono transition-all duration-300 ${
                isActive
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : isPast
                  ? "bg-accent/10 text-accent border border-accent/20"
                  : "bg-muted text-muted-foreground border border-border"
              }`}
            >
              {isPast && !isActive ? (
                <span className="text-accent">✓</span>
              ) : isActive ? (
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              ) : null}
              {step.label}
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-4 h-px ${isPast ? "bg-accent/40" : "bg-border"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
