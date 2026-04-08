import { FLState } from "@/lib/federated-learning";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Cpu, Upload, Shield, BarChart3, Eye } from "lucide-react";

interface AgentActivityLogProps {
  state: FLState;
}

const AGENT_ICONS: Record<string, typeof Cpu> = {
  Orchestrator: Cpu,
  "Client A": Bot,
  "Client B": Bot,
  "Client C": Bot,
  Aggregation: Upload,
  Privacy: Shield,
  Monitor: BarChart3,
  Deployment: Eye,
};

interface LogEntry {
  agent: string;
  message: string;
  type: "info" | "success" | "warning" | "action";
}

export function AgentActivityLog({ state }: AgentActivityLogProps) {
  const logs: LogEntry[] = [];

  state.rounds.forEach((r) => {
    logs.push({ agent: "Orchestrator", message: `Round ${r.round} initiated — distributing global model to ${r.clientResults.length} clients`, type: "action" });

    r.clientResults.forEach((cr) => {
      const clientName = cr.clientId.replace("hospital-", "Client ").replace("a", "A").replace("b", "B").replace("c", "C");
      logs.push({ agent: clientName, message: `Local training complete — acc: ${(cr.accuracy * 100).toFixed(1)}%`, type: "success" });
    });

    r.clientResults.forEach((cr) => {
      const clientName = cr.clientId.replace("hospital-", "Client ").replace("a", "A").replace("b", "B").replace("c", "C");
      logs.push({ agent: "Privacy", message: `Noise injected for ${clientName}: σ=${cr.noiseAdded.toFixed(6)}`, type: "warning" });
    });

    logs.push({ agent: "Aggregation", message: `FedAvg applied — new global model generated`, type: "action" });
    logs.push({ agent: "Monitor", message: `Round ${r.round} metrics: acc=${(r.globalAccuracy * 100).toFixed(1)}% loss=${r.globalLoss.toFixed(3)} duration=${r.duration}ms`, type: "info" });
  });

  if (state.phase === "complete") {
    logs.push({ agent: "Deployment", message: "Model ready for deployment", type: "success" });
  }

  if (state.phase !== "idle" && state.phase !== "complete") {
    const phaseAgent: Record<string, string> = {
      distributing: "Orchestrator",
      local_training: "Client A",
      aggregating: "Aggregation",
      evaluating: "Monitor",
    };
    logs.push({ agent: phaseAgent[state.phase] || "Orchestrator", message: `${state.phase.replace("_", " ")}...`, type: "info" });
  }

  const colorMap: Record<LogEntry["type"], string> = {
    info: "text-secondary-foreground",
    success: "text-accent",
    warning: "text-chart-4",
    action: "text-primary",
  };

  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <h3 className="text-sm font-semibold text-foreground mb-3">Agent Activity</h3>
      <ScrollArea className="h-56">
        <div className="space-y-1.5 font-mono text-[11px]">
          {logs.length === 0 ? (
            <span className="text-muted-foreground">Agents idle. Start training to see activity.</span>
          ) : (
            logs.map((log, i) => {
              const Icon = AGENT_ICONS[log.agent] || Cpu;
              return (
                <div key={i} className="flex items-start gap-2">
                  <Icon className="w-3 h-3 mt-0.5 shrink-0 text-muted-foreground" />
                  <span className="text-muted-foreground shrink-0 w-20 truncate">{log.agent}</span>
                  <span className={colorMap[log.type]}>{log.message}</span>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
