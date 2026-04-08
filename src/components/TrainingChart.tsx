import { TrainingRound } from "@/lib/federated-learning";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface TrainingChartProps {
  rounds: TrainingRound[];
}

export function TrainingChart({ rounds }: TrainingChartProps) {
  const data = rounds.map((r) => ({
    round: `R${r.round}`,
    accuracy: +(r.globalAccuracy * 100).toFixed(1),
    loss: +r.globalLoss.toFixed(3),
    ...Object.fromEntries(
      r.clientResults.map((cr, i) => [`client${i + 1}`, +(cr.accuracy * 100).toFixed(1)])
    ),
  }));

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm font-mono">
        Waiting for training data...
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Global Accuracy (%)</h3>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" />
            <XAxis dataKey="round" stroke="hsl(215 20% 55%)" fontSize={11} />
            <YAxis stroke="hsl(215 20% 55%)" fontSize={11} domain={[50, 100]} />
            <Tooltip
              contentStyle={{
                background: "hsl(222 41% 10%)",
                border: "1px solid hsl(222 30% 18%)",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="accuracy" stroke="hsl(187 72% 50%)" strokeWidth={2.5} dot={{ r: 4 }} name="Global" />
            <Line type="monotone" dataKey="client1" stroke="hsl(160 60% 45%)" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="Client A" />
            <Line type="monotone" dataKey="client2" stroke="hsl(280 60% 55%)" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="Client B" />
            <Line type="monotone" dataKey="client3" stroke="hsl(35 85% 55%)" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="Client C" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Global Loss</h3>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" />
            <XAxis dataKey="round" stroke="hsl(215 20% 55%)" fontSize={11} />
            <YAxis stroke="hsl(215 20% 55%)" fontSize={11} />
            <Tooltip
              contentStyle={{
                background: "hsl(222 41% 10%)",
                border: "1px solid hsl(222 30% 18%)",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Line type="monotone" dataKey="loss" stroke="hsl(340 65% 55%)" strokeWidth={2.5} dot={{ r: 4 }} name="Loss" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
