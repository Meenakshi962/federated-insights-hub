import { ClientState } from "@/lib/federated-learning";
import { Activity, Database, Lock } from "lucide-react";

interface ClientCardsProps {
  clients: ClientState[];
}

export function ClientCards({ clients }: ClientCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {clients.map((client, i) => (
        <div
          key={client.id}
          className={`rounded-xl border p-5 transition-all duration-500 animate-fade-in ${
            client.status === "training"
              ? "glow-border-strong bg-primary/5"
              : client.status === "done"
              ? "border-accent/40 bg-accent/5"
              : "border-border bg-card"
          }`}
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-foreground">{client.name}</h3>
              <p className="text-xs text-muted-foreground">{client.hospitalName}</p>
            </div>
            <StatusBadge status={client.status} />
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs">
              <Database className="w-3.5 h-3.5 text-primary" />
              <span className="text-muted-foreground">Samples:</span>
              <span className="font-mono text-foreground">{client.dataSize}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Activity className="w-3.5 h-3.5 text-accent" />
              <span className="text-muted-foreground">Accuracy:</span>
              <span className="font-mono text-foreground">
                {client.localAccuracy ? (client.localAccuracy * 100).toFixed(1) + "%" : "—"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Lock className="w-3.5 h-3.5 text-chart-5" />
              <span className="text-muted-foreground">Privacy ε:</span>
              <span className="font-mono text-foreground">{client.privacyBudget.toFixed(1)}</span>
            </div>
          </div>

          {client.status === "training" && (
            <div className="mt-4">
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-primary animate-pulse w-3/4" />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: ClientState["status"] }) {
  const config = {
    idle: { label: "Idle", className: "bg-muted text-muted-foreground" },
    training: { label: "Training", className: "bg-primary/20 text-primary" },
    sending: { label: "Sending", className: "bg-chart-4/20 text-chart-4" },
    done: { label: "Done", className: "bg-accent/20 text-accent" },
    error: { label: "Error", className: "bg-destructive/20 text-destructive" },
  };
  const c = config[status];
  return (
    <span className={`text-[10px] font-mono px-2 py-1 rounded-full ${c.className}`}>
      {c.label}
    </span>
  );
}
