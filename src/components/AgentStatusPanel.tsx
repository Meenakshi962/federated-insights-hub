import { FLState } from "@/lib/federated-learning";
import { Bot, Shield, BarChart3, Cpu, Upload, Eye } from "lucide-react";

interface AgentStatusPanelProps {
  state: FLState;
}

const AGENTS = [
  { id: "orchestrator", name: "Orchestrator", icon: Cpu, phases: ["distributing", "local_training", "aggregating", "evaluating"] },
  { id: "client", name: "Client Agents", icon: Bot, phases: ["local_training"] },
  { id: "aggregation", name: "Aggregation", icon: Upload, phases: ["aggregating"] },
  { id: "privacy", name: "Privacy Guard", icon: Shield, phases: ["local_training", "aggregating"] },
  { id: "monitor", name: "Monitor", icon: BarChart3, phases: ["evaluating", "distributing", "local_training", "aggregating"] },
  { id: "deploy", name: "Deployment", icon: Eye, phases: ["complete"] },
];

export function AgentStatusPanel({ state }: AgentStatusPanelProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {AGENTS.map((agent) => {
        const isActive = agent.phases.includes(state.phase);
        const Icon = agent.icon;
        return (
          <div
            key={agent.id}
            className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all duration-300 ${
              isActive
                ? "glow-border bg-primary/5"
                : "border-border bg-card"
            }`}
          >
            <div
              className={`p-2 rounded-full transition-all duration-300 ${
                isActive
                  ? "bg-primary/20 text-primary animate-pulse-glow"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
            </div>
            <span className="text-xs font-mono text-center leading-tight text-secondary-foreground">
              {agent.name}
            </span>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                isActive
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {isActive ? "ACTIVE" : "IDLE"}
            </span>
          </div>
        );
      })}
    </div>
  );
}
