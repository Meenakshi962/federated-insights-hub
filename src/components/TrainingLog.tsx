import { TrainingRound, FLState } from "@/lib/federated-learning";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TrainingLogProps {
  rounds: TrainingRound[];
  phase: FLState["phase"];
}

export function TrainingLog({ rounds, phase }: TrainingLogProps) {
  const logs: { time: string; msg: string; type: "info" | "success" | "warning" }[] = [];

  rounds.forEach((r) => {
    const t = new Date(r.timestamp).toLocaleTimeString();
    logs.push({ time: t, msg: `[Round ${r.round}] Started — distributing global model`, type: "info" });
    r.clientResults.forEach((cr) => {
      logs.push({
        time: t,
        msg: `  ↳ ${cr.clientId}: acc=${(cr.accuracy * 100).toFixed(1)}% noise=${cr.noiseAdded.toFixed(6)}`,
        type: "success",
      });
    });
    logs.push({
      time: t,
      msg: `[Round ${r.round}] Aggregated → global acc: ${(r.globalAccuracy * 100).toFixed(1)}% | loss: ${r.globalLoss.toFixed(3)}`,
      type: "warning",
    });
  });

  if (phase !== "idle" && phase !== "complete") {
    logs.push({ time: new Date().toLocaleTimeString(), msg: `⏳ ${phase.replace("_", " ")}...`, type: "info" });
  }

  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <h3 className="text-sm font-semibold text-foreground mb-3">Training Log</h3>
      <ScrollArea className="h-48">
        <div className="space-y-1 font-mono text-[11px]">
          {logs.length === 0 ? (
            <span className="text-muted-foreground">No logs yet. Start training to see output.</span>
          ) : (
            logs.map((log, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-muted-foreground shrink-0">{log.time}</span>
                <span
                  className={
                    log.type === "success"
                      ? "text-accent"
                      : log.type === "warning"
                      ? "text-chart-4"
                      : "text-secondary-foreground"
                  }
                >
                  {log.msg}
                </span>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
