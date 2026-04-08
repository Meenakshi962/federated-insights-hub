
# 🤖 Agentic Federated Learning Simulation

A complete, autonomous, privacy-preserving Federated Learning system built in pure Python (NumPy + scikit-learn). An AI Orchestrator Agent manages the training loop end-to-end — deciding when to continue, adjust strategy, or stop early.

---

## 📁 Project Structure

```
federated_ai/
├── model.py          # NumPy MLP neural network (PyTorch-compatible interface)
├── client.py         # Federated clients with local training + Differential Privacy
├── server.py         # Server: FedAvg aggregation, checkpointing, MLOps logging
├── agent.py          # OrchestratorAgent + MonitoringAgent (agentic decision-making)
├── main.py           # Simulation entry point
├── requirements.txt  # Dependencies
└── checkpoints/      # Auto-created: model checkpoints, metrics log, simulation log
```

---

## ⚙️ Setup & Installation

### 1. Create a virtual environment (recommended)
```bash
python3 -m venv venv
source venv/bin/activate       # Linux/macOS
venv\Scripts\activate          # Windows
```

### 2. Install dependencies
```bash
pip install -r requirements.txt
```
**requirements.txt:**
```
torch>=2.0.0        # optional — system falls back to NumPy automatically
numpy>=1.24.0
scikit-learn>=1.3.0
```
> **Note:** The system runs fully with **only NumPy + scikit-learn** (no PyTorch required). If PyTorch is available you can swap `model.py` for the PyTorch version described at the bottom of this README.

### 3. Run the simulation
```bash
python3 main.py
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    OrchestratorAgent                        │
│  ┌──────────────────┐    ┌────────────────────────────────┐ │
│  │  MonitoringAgent │───▶│ Decision: CONTINUE/ADJUST/STOP │ │
│  └──────────────────┘    └────────────────────────────────┘ │
└──────────────────────────────────┬──────────────────────────┘
                                   │ controls
                    ┌──────────────▼──────────────┐
                    │       FederatedServer        │
                    │  - Global model (MLP)        │
                    │  - FedAvg aggregation        │
                    │  - Checkpointing / MLOps     │
                    └──────┬──────────────┬────────┘
                           │distributes   │collects
                  ┌────────▼──┐      ┌───▼────────┐
                  │ Client 0  │ ...  │  Client N  │
                  │ Local data│      │ Local data │
                  │ Local SGD │      │ Local SGD  │
                  │ DP noise  │      │ DP noise   │
                  └───────────┘      └────────────┘
                  (raw data never shared — only Δweights)
```

---

## 🔑 Key Components

### `model.py` — MLP Neural Network
- 3-layer MLP: `128 → 64 → 32 → num_classes`
- Batch Normalisation + ReLU + Dropout (0.3)
- PyTorch-style `state_dict()` / `load_state_dict()` interface
- Xavier weight initialisation

### `client.py` — Federated Client
- Each client holds a **private local dataset** (never shared)
- Trains with mini-batch SGD for N local epochs
- **Differential Privacy:**
  - Gradient clipping (L2 norm ≤ 1.0)
  - Gaussian noise injection (σ = noise_multiplier × max_norm)
- Returns only **model parameter deltas** Δw = w_local − w_global

### `server.py` — Federated Server
- **FedAvg**: weighted average of client deltas by sample count
- Saves `.pkl` checkpoints every K rounds
- Tracks best model, version history
- Writes `checkpoints/metrics_log.json` (MLOps log)

### `agent.py` — Agentic AI Layer

**MonitoringAgent** observes:
- Rolling accuracy trend (window = 3 rounds)
- Plateau counter (no improvement for N rounds)
- Loss divergence detection

**OrchestratorAgent** decides:
| Condition | Decision | Action |
|---|---|---|
| Performance improving | ✅ CONTINUE | Proceed normally |
| Plateau ≥ 4 rounds | ⚙️ ADJUST | Boost LR ×1.5, add local epoch |
| Loss diverging | ⚙️ ADJUST | Reduce LR ×0.5, reduce DP noise |
| Target accuracy reached | 🛑 STOP | Save final checkpoint |
| Max rounds reached | 🛑 STOP | Save final checkpoint |
| Max adjustments exhausted | 🛑 STOP | Prevent overfitting |

---

## 🔒 Privacy Preservation

Per-batch, before each SGD step:
```python
# 1. Clip gradient L2 norm
scale = min(1.0, max_norm / gradient_norm)
gradients *= scale

# 2. Add calibrated Gaussian noise
noise = N(0, noise_multiplier × max_norm)
gradients += noise
```
This ensures ε-differential privacy: the server learns nothing about any individual training sample.

---

## 🔥 Fault Handling

Each round, `~20%` of clients are randomly dropped (configurable via `dropout_rate`).  
Training continues with the remaining clients as long as `len(active) ≥ min_clients (=2)`.

---

## 📊 Sample Output

```
════════════════════════════════════════════════════════════════════════
   🤖  AGENTIC FEDERATED LEARNING SIMULATION
   Clients: 5  |  Max Rounds: 25  |  Features: 20  |  Classes: 2
════════════════════════════════════════════════════════════════════════

  Data split: [131, 531, 1260, 83, 1993] train samples across 5 clients
  Model: 13,986 trainable parameters

────────────────────────────────────────────────────────────────────────
  📡  ROUND   1 / 25
────────────────────────────────────────────────────────────────────────
  Model summary         : MLP | Params: 13,986 | Version: v0
  Active clients        : client_1, client_2, client_3, client_4
  Dropped clients       : client_0
  Client metrics        :
    client_1: loss=0.8568  acc=0.4940  |█████████           |
    client_2: loss=0.3258  acc=0.8778  |█████████████████   |
    client_3: loss=0.7906  acc=0.5261  |██████████          |
    client_4: loss=0.6294  acc=0.6899  |█████████████       |
  ────────────────────────────────────────────────────────────────────
  Aggregated loss       : 0.5652
  Aggregated accuracy   : 0.7207  |██████████████      |
  Total samples         : 3,867
  Round duration        : 0.29s

  ✅ Agent decision: [INFO] CONTINUE — Training progressing normally.

... (rounds 2–12 continue improving) ...

────────────────────────────────────────────────────────────────────────
  📡  ROUND  13 / 25
────────────────────────────────────────────────────────────────────────
  ⚙️  Agent decision: [WARNING] ADJUST — Plateau detected for 4 rounds.
                      Boosting LR ×1.5 and adding 1 local epoch(s).
  → client_0 LR: 0.010 → 0.015, epochs: 3 → 4
  → client_1 LR: 0.010 → 0.015, epochs: 3 → 4
  ...

────────────────────────────────────────────────────────────────────────
  📡  ROUND  19 / 25
────────────────────────────────────────────────────────────────────────
  Aggregated accuracy   : 0.9277  |██████████████████  |

  🛑 Agent decision: [INFO] STOP — Target accuracy 92% achieved (best=0.9277).

════════════════════════════════════════════════════════════════════════
  📊  SIMULATION COMPLETE — FINAL SUMMARY
════════════════════════════════════════════════════════════════════════
  Total rounds run       : 19
  CONTINUE decisions     : 16
  ADJUST  decisions      : 2
  STOP    decisions      : 1
  Strategy adjustments   : 2
  Best accuracy achieved : 0.9277 (92.77%)
  Best checkpoint        : global_model_round019_v4_acc0.9277.pkl

  📈 Accuracy Progression:
    Round   1: 0.7207 |████████████████████████████            |
    Round   3: 0.8028 |████████████████████████████████        |
    Round   9: 0.8771 |███████████████████████████████████     |
    Round  19: 0.9277 |█████████████████████████████████████   |
════════════════════════════════════════════════════════════════════════
```

---

## ⚙️ Configuration

Edit the constants at the top of `main.py`:

| Parameter | Default | Description |
|---|---|---|
| `NUM_CLIENTS` | 5 | Number of federated participants |
| `NUM_ROUNDS` | 25 | Maximum training rounds |
| `INPUT_DIM` | 20 | Feature dimensions |
| `NUM_CLASSES` | 2 | Output classes |
| `N_SAMPLES` | 5000 | Total synthetic data points |

Agent behaviour in `main.py → OrchestratorConfig / MonitoringConfig`:

| Parameter | Default | Description |
|---|---|---|
| `plateau_patience` | 4 | Rounds before triggering ADJUST |
| `target_accuracy` | 0.92 | Accuracy at which to stop |
| `dropout_rate` | 0.20 | Fraction of clients to drop each round |
| `lr_boost_factor` | 1.5 | LR multiplier on ADJUST |
| `noise_multiplier` | 0.01 | DP noise level |

---

## 📂 Output Files

After running, the `checkpoints/` directory contains:

```
checkpoints/
├── best_model.pkl                          # Best global model weights
├── global_model_round005_v1_acc0.79.pkl    # Checkpoint at round 5
├── global_model_round010_v2_acc0.85.pkl    # Checkpoint at round 10
├── global_model_roundXXX_vN_accY.pkl       # Final checkpoint
├── metrics_log.json                        # Full MLOps metrics log (JSON)
└── simulation.log                          # Detailed text log
```

`metrics_log.json` example:
```json
{
  "rounds": [
    {
      "round": 1,
      "active_clients": ["client_1","client_2","client_3","client_4"],
      "dropped_clients": ["client_0"],
      "loss": 0.5652,
      "accuracy": 0.7207,
      "n_samples": 3867,
      "duration_sec": 0.29,
      "checkpoint": null
    }
  ],
  "best_accuracy": 0.9277,
  "best_checkpoint": "checkpoints/best_model.pkl"
}
```

---

# 🤖 Agentic Federated Learning Simulation

A complete, autonomous, privacy-preserving Federated Learning system built in pure Python (NumPy + scikit-learn). An AI Orchestrator Agent manages the training loop end-to-end — deciding when to continue, adjust strategy, or stop early.

---

## 📁 Project Structure

```
federated_ai/
├── model.py          # NumPy MLP neural network (PyTorch-compatible interface)
├── client.py         # Federated clients with local training + Differential Privacy
├── server.py         # Server: FedAvg aggregation, checkpointing, MLOps logging
├── agent.py          # OrchestratorAgent + MonitoringAgent (agentic decision-making)
├── main.py           # Simulation entry point
├── requirements.txt  # Dependencies
└── checkpoints/      # Auto-created: model checkpoints, metrics log, simulation log
```

---

## ⚙️ Setup & Installation

### 1. Create a virtual environment (recommended)
```bash
python3 -m venv venv
source venv/bin/activate       # Linux/macOS
venv\Scripts\activate          # Windows
```

### 2. Install dependencies
```bash
pip install -r requirements.txt
```
**requirements.txt:**
```
torch>=2.0.0        # optional — system falls back to NumPy automatically
numpy>=1.24.0
scikit-learn>=1.3.0
```
> **Note:** The system runs fully with **only NumPy + scikit-learn** (no PyTorch required). If PyTorch is available you can swap `model.py` for the PyTorch version described at the bottom of this README.

### 3. Run the simulation
```bash
python3 main.py
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    OrchestratorAgent                        │
│  ┌──────────────────┐    ┌────────────────────────────────┐ │
│  │  MonitoringAgent │───▶│ Decision: CONTINUE/ADJUST/STOP │ │
│  └──────────────────┘    └────────────────────────────────┘ │
└──────────────────────────────────┬──────────────────────────┘
                                   │ controls
                    ┌──────────────▼──────────────┐
                    │       FederatedServer        │
                    │  - Global model (MLP)        │
                    │  - FedAvg aggregation        │
                    │  - Checkpointing / MLOps     │
                    └──────┬──────────────┬────────┘
                           │distributes   │collects
                  ┌────────▼──┐      ┌───▼────────┐
                  │ Client 0  │ ...  │  Client N  │
                  │ Local data│      │ Local data │
                  │ Local SGD │      │ Local SGD  │
                  │ DP noise  │      │ DP noise   │
                  └───────────┘      └────────────┘
                  (raw data never shared — only Δweights)
```

---

## 🔑 Key Components

### `model.py` — MLP Neural Network
- 3-layer MLP: `128 → 64 → 32 → num_classes`
- Batch Normalisation + ReLU + Dropout (0.3)
- PyTorch-style `state_dict()` / `load_state_dict()` interface
- Xavier weight initialisation

### `client.py` — Federated Client
- Each client holds a **private local dataset** (never shared)
- Trains with mini-batch SGD for N local epochs
- **Differential Privacy:**
  - Gradient clipping (L2 norm ≤ 1.0)
  - Gaussian noise injection (σ = noise_multiplier × max_norm)
- Returns only **model parameter deltas** Δw = w_local − w_global

### `server.py` — Federated Server
- **FedAvg**: weighted average of client deltas by sample count
- Saves `.pkl` checkpoints every K rounds
- Tracks best model, version history
- Writes `checkpoints/metrics_log.json` (MLOps log)

### `agent.py` — Agentic AI Layer

**MonitoringAgent** observes:
- Rolling accuracy trend (window = 3 rounds)
- Plateau counter (no improvement for N rounds)
- Loss divergence detection

**OrchestratorAgent** decides:
| Condition | Decision | Action |
|---|---|---|
| Performance improving | ✅ CONTINUE | Proceed normally |
| Plateau ≥ 4 rounds | ⚙️ ADJUST | Boost LR ×1.5, add local epoch |
| Loss diverging | ⚙️ ADJUST | Reduce LR ×0.5, reduce DP noise |
| Target accuracy reached | 🛑 STOP | Save final checkpoint |
| Max rounds reached | 🛑 STOP | Save final checkpoint |
| Max adjustments exhausted | 🛑 STOP | Prevent overfitting |

---

## 🔒 Privacy Preservation

Per-batch, before each SGD step:
```python
# 1. Clip gradient L2 norm
scale = min(1.0, max_norm / gradient_norm)
gradients *= scale

# 2. Add calibrated Gaussian noise
noise = N(0, noise_multiplier × max_norm)
gradients += noise
```
This ensures ε-differential privacy: the server learns nothing about any individual training sample.

---

## 🔥 Fault Handling

Each round, `~20%` of clients are randomly dropped (configurable via `dropout_rate`).  
Training continues with the remaining clients as long as `len(active) ≥ min_clients (=2)`.

---

## 📊 Sample Output

```
════════════════════════════════════════════════════════════════════════
   🤖  AGENTIC FEDERATED LEARNING SIMULATION
   Clients: 5  |  Max Rounds: 25  |  Features: 20  |  Classes: 2
════════════════════════════════════════════════════════════════════════

  Data split: [131, 531, 1260, 83, 1993] train samples across 5 clients
  Model: 13,986 trainable parameters

────────────────────────────────────────────────────────────────────────
  📡  ROUND   1 / 25
────────────────────────────────────────────────────────────────────────
  Model summary         : MLP | Params: 13,986 | Version: v0
  Active clients        : client_1, client_2, client_3, client_4
  Dropped clients       : client_0
  Client metrics        :
    client_1: loss=0.8568  acc=0.4940  |█████████           |
    client_2: loss=0.3258  acc=0.8778  |█████████████████   |
    client_3: loss=0.7906  acc=0.5261  |██████████          |
    client_4: loss=0.6294  acc=0.6899  |█████████████       |
  ────────────────────────────────────────────────────────────────────
  Aggregated loss       : 0.5652
  Aggregated accuracy   : 0.7207  |██████████████      |
  Total samples         : 3,867
  Round duration        : 0.29s

  ✅ Agent decision: [INFO] CONTINUE — Training progressing normally.

... (rounds 2–12 continue improving) ...

────────────────────────────────────────────────────────────────────────
  📡  ROUND  13 / 25
────────────────────────────────────────────────────────────────────────
  ⚙️  Agent decision: [WARNING] ADJUST — Plateau detected for 4 rounds.
                      Boosting LR ×1.5 and adding 1 local epoch(s).
  → client_0 LR: 0.010 → 0.015, epochs: 3 → 4
  → client_1 LR: 0.010 → 0.015, epochs: 3 → 4
  ...

────────────────────────────────────────────────────────────────────────
  📡  ROUND  19 / 25
────────────────────────────────────────────────────────────────────────
  Aggregated accuracy   : 0.9277  |██████████████████  |

  🛑 Agent decision: [INFO] STOP — Target accuracy 92% achieved (best=0.9277).

════════════════════════════════════════════════════════════════════════
  📊  SIMULATION COMPLETE — FINAL SUMMARY
════════════════════════════════════════════════════════════════════════
  Total rounds run       : 19
  CONTINUE decisions     : 16
  ADJUST  decisions      : 2
  STOP    decisions      : 1
  Strategy adjustments   : 2
  Best accuracy achieved : 0.9277 (92.77%)
  Best checkpoint        : global_model_round019_v4_acc0.9277.pkl

  📈 Accuracy Progression:
    Round   1: 0.7207 |████████████████████████████            |
    Round   3: 0.8028 |████████████████████████████████        |
    Round   9: 0.8771 |███████████████████████████████████     |
    Round  19: 0.9277 |█████████████████████████████████████   |
════════════════════════════════════════════════════════════════════════
```

---

## ⚙️ Configuration

Edit the constants at the top of `main.py`:

| Parameter | Default | Description |
|---|---|---|
| `NUM_CLIENTS` | 5 | Number of federated participants |
| `NUM_ROUNDS` | 25 | Maximum training rounds |
| `INPUT_DIM` | 20 | Feature dimensions |
| `NUM_CLASSES` | 2 | Output classes |
| `N_SAMPLES` | 5000 | Total synthetic data points |

Agent behaviour in `main.py → OrchestratorConfig / MonitoringConfig`:

| Parameter | Default | Description |
|---|---|---|
| `plateau_patience` | 4 | Rounds before triggering ADJUST |
| `target_accuracy` | 0.92 | Accuracy at which to stop |
| `dropout_rate` | 0.20 | Fraction of clients to drop each round |
| `lr_boost_factor` | 1.5 | LR multiplier on ADJUST |
| `noise_multiplier` | 0.01 | DP noise level |

---

## 📂 Output Files

After running, the `checkpoints/` directory contains:

```
checkpoints/
├── best_model.pkl                          # Best global model weights
├── global_model_round005_v1_acc0.79.pkl    # Checkpoint at round 5
├── global_model_round010_v2_acc0.85.pkl    # Checkpoint at round 10
├── global_model_roundXXX_vN_accY.pkl       # Final checkpoint
├── metrics_log.json                        # Full MLOps metrics log (JSON)
└── simulation.log                          # Detailed text log
```

`metrics_log.json` example:
```json
{
  "rounds": [
    {
      "round": 1,
      "active_clients": ["client_1","client_2","client_3","client_4"],
      "dropped_clients": ["client_0"],
      "loss": 0.5652,
      "accuracy": 0.7207,
      "n_samples": 3867,
      "duration_sec": 0.29,
      "checkpoint": null
    }
  ],
  "best_accuracy": 0.9277,
  "best_checkpoint": "checkpoints/best_model.pkl"
}
```

---

https://id-preview--dd2a9512-7812-4c39-bfda-0e64f197cae2.lovable.app/?__lovable_token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiS2Z1ZU1lV3hrN1VSSmJSVXNVMEFXTWxRUGZvMSIsInByb2plY3RfaWQiOiJkZDJhOTUxMi03ODEyLTRjMzktYmZkYS0wZTY0ZjE5N2NhZTIiLCJhY2Nlc3NfdHlwZSI6InByb2plY3QiLCJpc3MiOiJsb3ZhYmxlLWFwaSIsInN1YiI6ImRkMmE5NTEyLTc4MTItNGMzOS1iZmRhLTBlNjRmMTk3Y2FlMiIsImF1ZCI6WyJsb3ZhYmxlLWFwcCJdLCJleHAiOjE3NzYyNTA3MzYsIm5iZiI6MTc3NTY0NTkzNiwiaWF0IjoxNzc1NjQ1OTM2fQ.Eux0Z0I5ee-YT_fJzkRP4XV_Uk6YZcIigLx1F0JBjRwjgPrOanOcbI9k5qtbdWodDNm_2dCD2bw_IvPYuzih97fLneQcYiiIxRXKBRnNCPlyAugvdmLA4oc9QsqqQYNYFAyDzhcI5FE9TWyKYNQMgY1xuu-gGEXBzUb3iE28DWDvCm_k-Z6MCQYfSFW4I1813BM_hMf2561OL5voLmFGYiMYH3T87hOngIxms1hfVttKWptDXgGLNlRf1XGkf7fcAql4gLvrLH0RRx0e-wZ4zQ3Q8gD8BisO0YLM3i2qoPtISg8pK3rQhjRdCYC-3VBMvpXHK4aDLCWo0TTI9HRjaKBV5KP_cAvcv8k3obcEYIuDmkXAWGiQlNrqmyqXdxOrdeSYksmj4yyBqMghdiDwfa8pJlTa6EUuXQ1fJnmbr3Fgrhvf30p2FuniacZBfhJ1BtLkg9JQ7_80X5SXKk0DpvrvOZJ29Fi_qJoGvsMOPZTj3JOH9z_R0z1B0-Uvl9ktB6S99b59-tUGWK9yIRd6pcaw2wZT34BkoqfIPB_LNaiigAE_CO9pxz8GuiLXEFf3clvh9NnSfVCTQZbT9EevOAWcyYUzS_BAWBAqHtg1QRI7WX5JBLfJT0RULrQ8rMf9r1lzl7prC5UAHiw27MpgJOSq_KxGecvcRgnhG6Qswjc
