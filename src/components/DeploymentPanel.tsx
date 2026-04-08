import { useState } from "react";
import { FLState } from "@/lib/federated-learning";
import { Rocket, Globe, Copy, Check, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DeploymentPanelProps {
  state: FLState;
}

export function DeploymentPanel({ state }: DeploymentPanelProps) {
  const [deployed, setDeployed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [prediction, setPrediction] = useState<string | null>(null);

  const isDone = state.currentRound >= state.totalRounds && state.rounds.length > 0;
  const lastRound = state.rounds[state.rounds.length - 1];
  const modelVersion = lastRound ? `v1.${state.rounds.length - 1}` : null;
  const endpoint = "https://api.flaas.ai/v1/predict";

  const handleDeploy = () => {
    setDeployed(true);
    setPrediction(null);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(endpoint);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePredict = () => {
    const acc = lastRound ? lastRound.globalAccuracy : 0.5;
    const result = Math.random() < acc ? "Benign" : "Malignant";
    const confidence = (0.75 + Math.random() * 0.2).toFixed(3);
    setPrediction(`{ "prediction": "${result}", "confidence": ${confidence}, "model": "${modelVersion}" }`);
  };

  return (
    <div className="bg-card rounded-xl border border-border p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Rocket className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Model Deployment</h3>
      </div>

      {!isDone ? (
        <p className="text-xs text-muted-foreground font-mono">
          Complete all training rounds to enable deployment.
        </p>
      ) : !deployed ? (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Model <span className="text-primary font-mono">{modelVersion}</span> ready — accuracy{" "}
            <span className="text-accent font-mono">{(lastRound!.globalAccuracy * 100).toFixed(1)}%</span>
          </p>
          <Button
            onClick={handleDeploy}
            size="sm"
            className="bg-accent text-accent-foreground hover:bg-accent/90 gap-1.5"
          >
            <Rocket className="w-3.5 h-3.5" />
            Deploy Model
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-xs font-mono text-accent">DEPLOYED</span>
            <span className="text-xs text-muted-foreground ml-1">{modelVersion}</span>
          </div>

          <div className="rounded-lg bg-muted/50 border border-border p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-primary" />
              <span className="text-[11px] text-muted-foreground">API Endpoint</span>
            </div>
            <div className="flex items-center gap-2">
              <code className="text-xs font-mono text-foreground flex-1 truncate">{endpoint}</code>
              <Button variant="ghost" size="sm" className="h-7 px-2" onClick={handleCopy}>
                {copied ? <Check className="w-3 h-3 text-accent" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Button
              onClick={handlePredict}
              size="sm"
              variant="outline"
              className="border-primary/30 text-primary hover:bg-primary/10 gap-1.5"
            >
              <Terminal className="w-3.5 h-3.5" />
              Test Prediction
            </Button>
            {prediction && (
              <pre className="text-[11px] font-mono bg-muted/50 border border-border rounded-lg p-3 text-accent overflow-x-auto">
                {prediction}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
