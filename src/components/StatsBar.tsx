import { FLState } from "@/lib/federated-learning";
import { Users, Repeat, Target, TrendingDown } from "lucide-react";

interface StatsBarProps {
  state: FLState;
}

export function StatsBar({ state }: StatsBarProps) {
  const lastRound = state.rounds[state.rounds.length - 1];
  const stats = [
    {
      label: "Clients",
      value: state.clients.length.toString(),
      icon: Users,
      color: "text-primary",
    },
    {
      label: "Round",
      value: `${state.currentRound} / ${state.totalRounds}`,
      icon: Repeat,
      color: "text-accent",
    },
    {
      label: "Accuracy",
      value: lastRound ? (lastRound.globalAccuracy * 100).toFixed(1) + "%" : "—",
      icon: Target,
      color: "text-chart-4",
    },
    {
      label: "Loss",
      value: lastRound ? lastRound.globalLoss.toFixed(3) : "—",
      icon: TrendingDown,
      color: "text-chart-5",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <div key={s.label} className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-muted ${s.color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{s.label}</p>
              <p className="text-lg font-semibold font-mono text-foreground">{s.value}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
