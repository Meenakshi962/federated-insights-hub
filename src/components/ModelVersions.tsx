import { TrainingRound } from "@/lib/federated-learning";
import { Download, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ModelVersionsProps {
  rounds: TrainingRound[];
}

export function ModelVersions({ rounds }: ModelVersionsProps) {
  const versions = rounds.map((r, i) => ({
    version: `v1.${i}`,
    round: r.round,
    accuracy: r.globalAccuracy,
    loss: r.globalLoss,
    timestamp: new Date(r.timestamp).toLocaleString(),
  }));

  const handleDownload = (version: string) => {
    const data = JSON.stringify({ version, type: "federated_model", framework: "simulated" }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `flaas_model_${version}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">Model Versions</h3>
      {versions.length === 0 ? (
        <p className="text-xs text-muted-foreground font-mono">No models yet.</p>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {versions.reverse().map((v) => (
            <div key={v.version} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center gap-3">
                <Tag className="w-4 h-4 text-primary" />
                <div>
                  <span className="text-xs font-mono font-semibold text-foreground">{v.version}</span>
                  <span className="text-[10px] text-muted-foreground ml-2">Round {v.round}</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs font-mono text-accent">{(v.accuracy * 100).toFixed(1)}%</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-primary hover:text-primary hover:bg-primary/10"
                  onClick={() => handleDownload(v.version)}
                >
                  <Download className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
