<p align="center">
  <img src="./assets/logo_glow.svg" alt="Agent Shastra Cyberpunk Logo Banner" width="100%" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Agent%20Shastra-SRE%20Diagnostic%20Kernel-4F46E5?style=for-the-badge&logo=shield" alt="Agent Shastra" />
  <img src="https://img.shields.io/badge/Model-Gemini%202.0%20Flash-0F9D58?style=for-the-badge&logo=google" alt="Gemini" />
  <img src="https://img.shields.io/badge/Status-Kernel%20Online-10B981?style=for-the-badge" alt="Status" />
</p>

<p align="center">
  <b>API Anomaly Detection & Root-Cause Resolution Engine</b> — Created by <b>Kishan Kumar</b>
</p>

---

Microservice incidents generate hundreds of alerts simultaneously. On-call engineers waste time triaging noise instead of fixing root causes.

Agent Shastra ingests structured JSON API telemetry, detects latency spikes and error rate anomalies, groups concurrent multi-service failures chronologically, and produces a ranked incident report with step-by-step debugging playbooks.

Output: a machine-readable `alert.json` and an interactive SRE dashboard — ready in seconds.

---

## ⭐ Core Capabilities

1. **🧠 Dual-Engine Diagnostics (Gemini AI + Local Fallback)**
   * Connects to Google Gemini (`gemini-2.0-flash`) for AI-powered root-cause analysis when online.
   * Automatically activates a local heuristics engine if no API key is present, the network is unreachable, or rate limits are hit. Sensitive logs never leave the local environment.

2. **🛡️ Zero-Leakage Baseline Isolation**
   * Traditional monitors suffer from "baseline dilution" — spikes bleed back into rolling averages and desensitize detection thresholds.
   * Agent Shastra segments anomalies immediately upon detection and excludes them from all subsequent baseline calculations.

3. **🗺️ Interactive Dependency Topology Map**
   * A dynamic SVG node map (`VPC-Gateway` → `auth-service`, `payment-api`, `order-api`).
   * Degraded nodes transition into a pulsing alert state and surface live diagnostic context directly in the UI.

4. **📋 Actionable SRE Playbooks**
   * Each incident produces a checkable task list for on-call engineers.
   * Terminal commands (Docker inspect, slow query logs, database diagnostics) are copyable with a single click.

5. **📋 Debounced JSON Paste Validator**
   * Supports direct raw clipboard paste of log data.
   * A 300ms debounced parser validates format and outputs instant state badges: `Awaiting Input` → `Valid Format` → `Partial Warning` → `Invalid Format`.

---

## 📥 Example Input

Upload or paste structured JSON API telemetry logs. Each entry must include:

```json
[
  {
    "timestamp": "2024-06-15T10:00:00Z",
    "endpoint": "/payment/process",
    "status": 200,
    "latency_ms": 102.3,
    "service": "payment-api"
  }
]
```

**Required fields:** `timestamp` · `endpoint` · `status` · `latency_ms`  
**Optional field:** `service`  
**Format:** JSON array. Malformed rows are skipped with warnings; valid rows are processed.

---

## 🛠️ Tech Stack

### 🐍 Backend (Python 3.10+)
| Component | Technology |
|---|---|
| API Framework | **FastAPI** |
| ASGI Server | **Uvicorn** (port 8000) |
| Data Validation | **Pydantic v2** |
| AI Engine | **Google Gemini (`gemini-2.0-flash`)** |
| Secondary LLM | **Anthropic Claude** (optional) |
| Secret Management | **python-dotenv** |

### ⚛️ Frontend (Next.js 15+)
| Component | Technology |
|---|---|
| Framework | **Next.js 15 / React 19** (TypeScript) |
| Styling | **Tailwind CSS** |
| Animations | **Framer Motion** |
| Icons | **Lucide React** |

---

## 🚀 Architectural Blueprint (The 5-Stage SRE Pipeline)

```
  Structured API Telemetry Logs
             │
             ▼
  ┌──────────────────────────────────┐
  │  Stage 1: Resilient Log Parser   │ ──► Drops malformed rows, enforces strict ISO-8601
  └──────────────────────────────────┘
             │
             ▼
  ┌──────────────────────────────────┐
  │  Stage 2: Anomaly Detector       │ ──► Isolated rolling baselines (mean & std dev)
  └──────────────────────────────────┘
             │
             ▼
  ┌──────────────────────────────────┐
  │  Stage 3: Chronological Grouper  │ ──► Clusters concurrent anomalies in O(N log N)
  └──────────────────────────────────┘
             │
             ▼
  ┌──────────────────────────────────┐
  │  Stage 4: Diagnostics Analyzer   │ ──► Gemini 2.0 Flash / Local Offline Fallback
  └──────────────────────────────────┘
             │
             ▼
  ┌──────────────────────────────────┐
  │  Stage 5: Incident Reporter      │ ──► Generates alert.json & CLI summaries
  └──────────────────────────────────┘
```

### 🔍 Stage 1: Resilient Log Parser (`parser.py`)
A non-crashing parser that audits raw JSON inputs row-by-row:
* Filters out malformed entries, missing fields, or invalid types without halting the pipeline.
* Enforces strict ISO-8601 timestamp conformance and ignores status codes outside SRE ranges `[100-599]`.
* Generates granular warning feeds, logging exact reasons for each skipped row.

### 📈 Stage 2: Anomaly Detector (`detector.py`)
Protects baselines from leakage, ensuring historical spikes never dilute rolling thresholds:
* **Latency Engine**: Computes rolling mean ($\mu$) and sample standard deviation ($\sigma$). Flags anomalies when latency exceeds $\mu + 2\sigma$. In zero-variance baselines, falls back to $5 \times \mu$.
* **Error Rate Engine**: Evaluates trailing 50-request windows split into two **disjoint** (non-overlapping) segments:
  * **Historical Baseline Window**: `window[:-10]` — 40 logs preceding the current state.
  * **Recent State Window**: `window[-10:]` — the last 10 logs.
  * An error rate anomaly triggers only if `current_rate` exceeds `5%` (`ERROR_RATE_THRESHOLD`) **OR** `current_rate > baseline_rate + 10pp` (`ERROR_RATE_DELTA`).
* **Deterministic Severity Scoring**:
  * **Latency**: Ratio $\ge 10 \rightarrow$ `CRITICAL`, $\ge 5 \rightarrow$ `HIGH`, $\ge 2 \rightarrow$ `WARNING`.
  * **Error Rate**: Rate $\ge 20\% \rightarrow$ `CRITICAL`, $\ge 10\% \rightarrow$ `HIGH`, $\ge 5\% \rightarrow$ `WARNING`.

### 🔗 Stage 3: Chronological Grouper (`grouper.py`)
Clusters multi-service anomalies using $O(N \log N)$ sorting and a linear sliding window:
* Groups failures occurring within a 120-second delta window — no nested loops.
* Generates deterministic, unique `group_id` signatures using SHA-1 hashing.

### 🧠 Stage 4: Diagnostics Analyzer (`analyzer.py`)
Enriches grouped alerts with root causes and recommended actions:
* **Active LLM**: Connects to **Google Gemini (`gemini-2.0-flash`)** to evaluate telemetry signals and generate contextual root causes.
* **Local Fallback**: If credentials are absent or the network is unavailable, activates localized diagnostic templates — including shared dependency degradation warnings for co-occurring failures.

### 📊 Stage 5: Incident Reporter (`reporter.py`)
Writes machine-readable `alert.json` and prints a structured CLI summary.

---

## 🖥️ Frontend Experience

The Next.js client acts as an interactive SRE workspace:

* **Dependency Topology Map**: Dynamic SVG node map. Degraded nodes glow, pulse, and display live diagnostic context.
* **JSON Log Paste Board**: Monospace paste area with debounced validation and instant state badges.
* **Playbook Action Checklist**: Checkable investigation steps with one-click terminal command copying.
* **Dual-Source Engine Badges**: Status badges dynamically reflect the active engine: `Gemini Engine` → `Claude Engine` → `Offline Engine`.
* **Raw Output Modal**: Displays the full `alert.json` payload in high-contrast white text on a dark background.
* **Dark / Light Mode**: Full theme toggle across all UI components.

---

## 🚀 Installation & Developer Setup

### 1. Prerequisites
Ensure **Python 3.10+** and **Node.js 18+** are installed.

### 2. Backend Setup
```bash
cd Agent-Shastra

pip install -r requirements.txt

python main.py
```
*FastAPI server starts at `http://127.0.0.1:8000`.*

### 3. Frontend Setup
```bash
cd frontend

npm install

npm run dev
```
*Dashboard is live at `http://localhost:3000`.*

---

## 🔑 Configuring Your Gemini API Key

```bash
cp .env.example .env
```

Open `.env` and add your key from [Google AI Studio](https://aistudio.google.com):
```env
GEMINI_API_KEY=your_key_here
```

> If no key is provided, the agent automatically activates the offline fallback engine with no performance penalty.

---

## 🧪 Test Harness

Agent Shastra includes a test runner (`test_detector.py`) verifying 13 distinct edge cases.

```bash
python test_detector.py
```

| Test | Description | Expected |
|---|---|---|
| Test 1 | Normal healthy logs | 0 anomalies |
| Test 2 | Latency spike | 1 CRITICAL spike detected |
| Test 3 | Error rate spike | Disjoint window, 50% failure rate |
| Test 4 | Multi-endpoint logs | Isolates degraded auth endpoint |
| Test 5 | Under-sampled logs | Gracefully skips small windows |
| Test 6 | Baseline isolation | Zero spike leakage into baseline mean |
| Test 7 | Single outlier (3×) | Maps to WARNING severity |
| Test 8 | 50% malformed entries | Skips corrupt, audits valid rows |
| Test 9 | Noisy baseline variance | No false positives on oscillating network |
| Scenario A | 40 healthy + 10 failures | Baseline ≈ 0%, Current ≈ 100% → CRITICAL |
| Scenario B | Old failures, recent healthy | No alert — recovered baseline |
| Scenario C | 200ms/500ms base + 1000ms spike | Realistic WARNING severity |
| Scenario D | Stable latencies only | No false alarms triggered |

---

## Known Limitations

- Optimized for structured JSON telemetry input.
- Root cause diagnostics are advisory and should not replace production observability tooling.
- Historical recovered incidents may intentionally not trigger alerts.
- Topology visualization operates at service abstraction level.
- The system explains incidents but does not modify infrastructure automatically.
- Designed to remain operational during network interruptions and unavailable AI providers, though no system guarantees absolute resilience under all failure conditions.

---

## 📄 License & Ownership
Copyright © 2026 Agent Shastra. All rights reserved.

Created, developed, and owned by **Kishan Kumar** ([GitHub Profile](https://www.github.com/techwithkishan)).
