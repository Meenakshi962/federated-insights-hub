// Federated Learning Simulation Engine

export interface ModelWeights {
  layers: number[][];
}

export interface ClientState {
  id: string;
  name: string;
  hospitalName: string;
  dataSize: number;
  localAccuracy: number;
  localLoss: number;
  status: "idle" | "training" | "sending" | "done" | "error";
  weights: ModelWeights;
  privacyBudget: number;
}

export interface TrainingRound {
  round: number;
  globalAccuracy: number;
  globalLoss: number;
  clientResults: {
    clientId: string;
    accuracy: number;
    loss: number;
    noiseAdded: number;
  }[];
  timestamp: number;
  duration: number;
}

export interface FLState {
  clients: ClientState[];
  globalModel: ModelWeights;
  rounds: TrainingRound[];
  currentRound: number;
  totalRounds: number;
  isTraining: boolean;
  phase: "idle" | "distributing" | "local_training" | "aggregating" | "evaluating" | "complete";
}

// Generate random weights to simulate a neural network
function generateWeights(layers: number[] = [30, 16, 8, 1]): ModelWeights {
  const result: number[][] = [];
  for (let i = 0; i < layers.length - 1; i++) {
    const layerWeights: number[] = [];
    const count = layers[i] * layers[i + 1];
    for (let j = 0; j < count; j++) {
      layerWeights.push((Math.random() - 0.5) * 0.1);
    }
    result.push(layerWeights);
  }
  return { layers: result };
}

// Simulate local training - improves weights with some randomness
function simulateLocalTraining(
  globalWeights: ModelWeights,
  dataSize: number,
  round: number
): { weights: ModelWeights; accuracy: number; loss: number } {
  const newLayers = globalWeights.layers.map((layer) =>
    layer.map((w) => w + (Math.random() - 0.5) * 0.02 * (1 / (1 + round * 0.3)))
  );

  // Simulate improving accuracy over rounds
  const baseAccuracy = 0.65 + round * 0.035 + (dataSize / 1000) * 0.02;
  const noise = (Math.random() - 0.5) * 0.05;
  const accuracy = Math.min(0.98, Math.max(0.5, baseAccuracy + noise));
  const loss = Math.max(0.02, 1.5 - round * 0.12 + (Math.random() - 0.5) * 0.1);

  return { weights: { layers: newLayers }, accuracy, loss };
}

// Add differential privacy noise (Gaussian)
function addDifferentialPrivacy(
  weights: ModelWeights,
  epsilon: number = 1.0
): { weights: ModelWeights; noiseScale: number } {
  const sigma = 1.0 / epsilon;
  const newLayers = weights.layers.map((layer) =>
    layer.map((w) => {
      // Box-Muller transform for Gaussian noise
      const u1 = Math.random();
      const u2 = Math.random();
      const noise = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2) * sigma * 0.001;
      return w + noise;
    })
  );
  return { weights: { layers: newLayers }, noiseScale: sigma * 0.001 };
}

// Federated Averaging
function federatedAverage(clientWeights: ModelWeights[], dataSizes: number[]): ModelWeights {
  const totalData = dataSizes.reduce((a, b) => a + b, 0);
  const weights = dataSizes.map((s) => s / totalData);

  const avgLayers = clientWeights[0].layers.map((layer, li) =>
    layer.map((_, wi) => {
      let sum = 0;
      for (let c = 0; c < clientWeights.length; c++) {
        sum += clientWeights[c].layers[li][wi] * weights[c];
      }
      return sum;
    })
  );

  return { layers: avgLayers };
}

// Hospital configurations
const HOSPITALS = [
  { id: "hospital-a", name: "Client A", hospitalName: "Metro General Hospital", dataSize: 350 },
  { id: "hospital-b", name: "Client B", hospitalName: "St. Mary's Medical Center", dataSize: 280 },
  { id: "hospital-c", name: "Client C", hospitalName: "University Research Hospital", dataSize: 420 },
];

export function createInitialState(totalRounds: number = 10): FLState {
  const globalModel = generateWeights();
  const clients: ClientState[] = HOSPITALS.map((h) => ({
    ...h,
    localAccuracy: 0,
    localLoss: 0,
    status: "idle" as const,
    weights: { layers: globalModel.layers.map((l) => [...l]) },
    privacyBudget: 1.0,
  }));

  return {
    clients,
    globalModel,
    rounds: [],
    currentRound: 0,
    totalRounds,
    isTraining: false,
    phase: "idle",
  };
}

export async function runTrainingRound(
  state: FLState,
  onPhaseChange: (phase: FLState["phase"], clients?: ClientState[]) => void
): Promise<{ newState: FLState; roundResult: TrainingRound }> {
  const round = state.currentRound;
  const startTime = Date.now();

  // Phase 1: Distribute
  onPhaseChange("distributing");
  await sleep(600);

  // Phase 2: Local training
  const updatedClients = [...state.clients];
  const clientResults: TrainingRound["clientResults"] = [];

  onPhaseChange(
    "local_training",
    updatedClients.map((c) => ({ ...c, status: "training" }))
  );
  await sleep(1200);

  const clientWeights: ModelWeights[] = [];
  const dataSizes: number[] = [];

  for (const client of updatedClients) {
    const { weights, accuracy, loss } = simulateLocalTraining(
      state.globalModel,
      client.dataSize,
      round
    );

    const { weights: noisyWeights, noiseScale } = addDifferentialPrivacy(weights, client.privacyBudget);

    client.weights = noisyWeights;
    client.localAccuracy = accuracy;
    client.localLoss = loss;
    client.status = "done";

    clientWeights.push(noisyWeights);
    dataSizes.push(client.dataSize);

    clientResults.push({
      clientId: client.id,
      accuracy,
      loss,
      noiseAdded: noiseScale,
    });
  }

  onPhaseChange("local_training", updatedClients);
  await sleep(400);

  // Phase 3: Aggregation
  onPhaseChange("aggregating");
  await sleep(800);

  const newGlobalModel = federatedAverage(clientWeights, dataSizes);

  // Phase 4: Evaluation
  onPhaseChange("evaluating");
  await sleep(500);

  const globalAccuracy =
    clientResults.reduce((sum, r) => sum + r.accuracy, 0) / clientResults.length;
  const globalLoss =
    clientResults.reduce((sum, r) => sum + r.loss, 0) / clientResults.length;

  const roundResult: TrainingRound = {
    round: round + 1,
    globalAccuracy,
    globalLoss,
    clientResults,
    timestamp: Date.now(),
    duration: Date.now() - startTime,
  };

  return {
    newState: {
      ...state,
      clients: updatedClients.map((c) => ({ ...c, status: "idle" })),
      globalModel: newGlobalModel,
      rounds: [...state.rounds, roundResult],
      currentRound: round + 1,
    },
    roundResult,
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
