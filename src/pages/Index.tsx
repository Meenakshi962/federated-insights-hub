import { useState, useCallback } from "react";
import { createInitialState, runTrainingRound, FLState } from "@/lib/federated-learning";
import { AgentStatusPanel } from "@/components/AgentStatusPanel";
import { ClientCards } from "@/components/ClientCards";
import { TrainingChart } from "@/components/TrainingChart";
import { TrainingLog } from "@/components/TrainingLog";
import { ModelVersions } from "@/components/ModelVersions";
import { StatsBar } from "@/components/StatsBar";
import { DeploymentPanel } from "@/components/DeploymentPanel";
import { AgentActivityLog } from "@/components/AgentActivityLog";
import { WorkflowProgress } from "@/components/WorkflowProgress";
import { Button } from "@/components/ui/button";
import { Play, RotateCcw, Zap, Square } from "lucide-react";

const Index = () => {
  const [state, setState] = useState<FLState>(() => createInitialState(10));
  const [isRunning, setIsRunning] = useState(false);
  const [stopRequested, setStopRequested] = useState(false);

  const runOneRound = useCallback(async () => {
    if (state.currentRound >= state.totalRounds) return;
    setIsRunning(true);

    const { newState } = await runTrainingRound(state, (phase, clients) => {
      setState((prev) => ({
        ...prev,
        phase,
        isTraining: true,
        ...(clients ? { clients } : {}),
      }));
    });

    setState({ ...newState, phase: newState.currentRound >= newState.totalRounds ? "complete" : "idle", isTraining: false });
    setIsRunning(false);
  }, [state]);

  const runAll = useCallback(async () => {
    let current = state;
    setIsRunning(true);
    setStopRequested(false);

    while (current.currentRound < current.totalRounds) {
      // Check stop flag via ref-like pattern
      if ((window as any).__flaas_stop) {
        (window as any).__flaas_stop = false;
        break;
      }

      const { newState } = await runTrainingRound(current, (phase, clients) => {
        setState((prev) => ({
          ...prev,
          phase,
          isTraining: true,
          ...(clients ? { clients } : {}),
        }));
      });
      current = { ...newState, phase: newState.currentRound >= newState.totalRounds ? "complete" : "idle", isTraining: false };
      setState(current);
    }

    setIsRunning(false);
    setStopRequested(false);
  }, [state]);

  const handleStop = () => {
    (window as any).__flaas_stop = true;
    setStopRequested(true);
  };

  const reset = () => {
    setState(createInitialState(10));
    setIsRunning(false);
    setStopRequested(false);
    (window as any).__flaas_stop = false;
  };

  const isDone = state.currentRound >= state.totalRounds;
  const showWorkflow = state.phase !== "idle" && state.phase !== "complete";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">FLaaS</h1>
              <p className="text-[11px] text-muted-foreground">Federated Learning as a Service</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isRunning ? (
              <Button
                onClick={handleStop}
                disabled={stopRequested}
                size="sm"
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-1.5"
              >
                <Square className="w-3.5 h-3.5" />
                {stopRequested ? "Stopping..." : "Stop"}
              </Button>
            ) : (
              <>
                <Button
                  onClick={runOneRound}
                  disabled={isDone}
                  size="sm"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" />
                  Next Round
                </Button>
                <Button
                  onClick={runAll}
                  disabled={isDone}
                  size="sm"
                  variant="outline"
                  className="border-primary/30 text-primary hover:bg-primary/10 gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5" />
                  Run All
                </Button>
              </>
            )}
            <Button onClick={reset} size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground gap-1.5">
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Workflow progress */}
        {showWorkflow && <WorkflowProgress state={state} />}

        {isDone && (
          <div className="text-center">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-mono">
              ✓ TRAINING COMPLETE
            </span>
          </div>
        )}

        <StatsBar state={state} />
        <AgentStatusPanel state={state} />
        <ClientCards clients={state.clients} />
        <TrainingChart rounds={state.rounds} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AgentActivityLog state={state} />
          <TrainingLog rounds={state.rounds} phase={state.phase} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ModelVersions rounds={state.rounds} />
          <DeploymentPanel state={state} />
        </div>
      </main>
    </div>
  );
};

export default Index;
