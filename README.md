# 🛡️ Agent Shastra: API Failure Detection & Debugging Agent

**Owner & Creator**: Kishan Kumar

---

Agent Shastra is an intelligent, high-performance, and lightweight systems monitoring and diagnostics agent designed for Site Reliability Engineering (SRE) and DevOps teams. It ingests microservice telemetry logs in real-time, automatically detects critical anomalies (latency spikes and error rate escalations), groups concurrent multi-service failures chronologically, and enriches incident alerts with actionable root-cause checklists using Google Gemini AI or a completely local, air-gapped offline diagnostics fallback engine.

Featuring a beautiful, interactive **Next.js Synthwave Dashboard**, **Scrolling Live Telemetry Waves**, and a **Dynamic SVG Topology Dependency Map**, Agent Shastra translates raw JSON telemetry noise into clear, step-by-step developer playbooks to help reduce manual investigation effort and accelerate incident triage.

---

## ⭐ Core Capabilities of Agent Shastra 

Agent Shastra is packed with highly advanced engineering features designed to impress SRE teams alike:

1. **🧠 Bulletproof Dual-Engine Diagnostics (Gemini AI + 100% Air-Gapped Local Fallback)**
   * Provides state-of-the-art AI diagnostics when online by calling Google Gemini (`gemini-2.0-flash`).
   * If offline, it automatically activates a robust, expert-mode Local Diagnostics Heuristics Engine. This makes the system **100% resilient to network drops, API key quotas, or rate limits** while keeping sensitive logs entirely within private local networks.

2. **🛡️ Zero-Leakage Baseline Isolation Guard**
   * Traditional monitoring engines are prone to "baseline dilution" where ongoing latency spikes bleed back into historical averages and desensitize thresholds. 
   * Agent Shastra implements strict chronological isolation: once an anomaly is flagged, it is immediately segmented and **never** returned to the rolling baseline pool.

3. **🗺️ Interactive Dependency Topology Map**
   * A dynamic, custom SVG node dependency map (`VPC-Gateway` -> `auth-service`, `payment-api`, `order-api`).
   * When an endpoint fails, the respective node dynamically transitions into a degraded state, initiates pulsing radar warning alerts, and displays comprehensive SRE diagnostic details inside the UI.

4. **📈 Monospace Debounced JSON Log Paste Board**
   * An extraordinary UX that supports direct raw clipboard paste validation.
   * Employs a custom debounced (300ms) JSON schema parser that validates log format parameters and outputs instant, colorful state badges (`Awaiting Input` ➡️ `Valid Format` ➡️ `Partial Warning` ➡️ `Invalid Format`).

5. **⚡ High-Performance $O(N \log N)$ chronological correlation**
   * Groups co-occurring multi-service incidents occurring within 120 seconds using high-efficiency chronological sorting.
   * Completely avoids slow nested $O(N^2)$ loops, running across thousands of raw log rows in under milliseconds.

6. **🎨 Cinematic Synthwave Aesthetics & Custom WebGL Shaders**
   * A stunning, premium visual design crafted with harmonized dark-mode glassmorphism and subtle micro-interactions.
   * Powered by custom WebGL React shaders (`ChromaFlow` fluid waves, `FilmGrain`, `FlutedGlass` panels) creating a visually arresting user experience.

7. **📋 Actionable Checklist SRE Playbooks**
   * Translates abstract anomalies into concrete, checkable tasks for on-call engineers.
   * Interactive playbooks allow developers to tick off investigation items and copy terminal commands (like Docker, Slow Query Logs, or database diagnostic lines) with a single click.

---

## 🛠️ Complete Tech Stack Specifications

Agent Shastra is designed with a premium, robust, and highly optimized dual-stack architecture:

### 🐍 Backend Diagnostics Engine (Python 3.10+)
* **Core API Framework**: **FastAPI** (High-performance ASGI framework with automatic OpenAPI/Swagger documentation).
* **ASGI Server**: **Uvicorn** (Lightning-fast web server bridge running on port 8000).
* **Data Validation & Typing**: **Pydantic v2** (Strict runtime validation, parsing, and JSON serialization).
* **LLM AI Integrations**:
  * **Google Generative AI SDK** (`google-genai` utilizing standard `gemini-2.0-flash` models).
  * **Anthropic Claude SDK** (`anthropic` for secondary high-performance LLM diagnostics).
* **Core Libraries & Utilities**:
  * `python-dotenv`: Safe `.env` file loader for air-gapped secret credentials isolation.
  * `hashlib`: Deterministic SHA-1 cryptographic fingerprinting for high-speed chronological grouper buckets.
  * `math`, `json`, `sys`, `os`, `tempfile`, `shutil`: Standard math and secure system utilities.

### ⚛️ Frontend SRE Workspace Client (Next.js 15+)
* **Application Framework**: **Next.js (React 19)** (TypeScript-configured Single Page Application architecture).
* **Styling Engine**: **Tailwind CSS** (Utility-first fluid typography and responsive grid layout controls).
* **Motion Graphics & Animations**: **Framer Motion** (Smooth hardware-accelerated spring-based UI animations).
* **Fluid Shaders & Visuals**: **WebGL Custom React Shaders** (ChromaFlow, Swirl, FilmGrain, FlutedGlass for realistic atmospheric visual rendering).
* **Icons Library**: **Lucide React** (Vector-based crisp developer icon sheets).
* **Telemetry Streaming**: Real-time canvas drawing utility mapping rolling live latency waves.
* **SVG Graphics**: Custom dynamic SVG Topology Dependency node networks with active pulsing radar animations.

---

## 🚀 Architectural Blueprint (The 5-Stage SRE Pipeline)

Agent Shastra organizes its operations into a robust pipeline, strictly enforcing separation of concerns and protecting against telemetry data leakage:

```
  Structured API Telemetry Logs
             │
             ▼
  ┌──────────────────────────────────┐
  │  Stage 1: Resilient Log Parser   │ ──► Drops malformed rows, enforces strict ISO-8601                    |
  └──────────────────────────────────┘
             │
             ▼
  ┌──────────────────────────────────┐
  │  Stage 2: Anomaly Detector       │ ──► Isolated rolling baselines (mean & std dev)                           |
  └──────────────────────────────────┘
             │
             ▼
  ┌──────────────────────────────────┐
  │  Stage 3: Chronological Grouper  │ ──► Clusters concurrent anomalies in O(N log N)                             |
  └──────────────────────────────────┘
             │
             ▼
  ┌──────────────────────────────────┐
  │  Stage 4: Diagnostics Analyzer   │ ──► Google Gemini V2.0 Flash / Local Offline Fallback                   |
  └──────────────────────────────────┘
             │
             ▼
  ┌──────────────────────────────────┐
  │  Stage 5: Incident Reporter      │ ──► Generates alert.json & elegant CLI summaries
  └──────────────────────────────────┘
```

### 🔍 Stage 1: Resilient Log Parser (`parser.py`)
A bulletproof, non-crashing parser that audits raw JSON inputs row-by-row:
* Filters out malformed entries, missing fields, or invalid types without crashing the thread.
* Enforces strict ISO-8601 timestamp conformance and ignores status codes outside SRE ranges `[100-599]`.
* Generates granular warning feeds, logging exact reasons for skipped telemetry rows.

### 📈 Stage 2: Anomaly Detector (`detector.py`)
Protects SRE baselines from leakage, ensuring historical spikes never dilute rolling thresholds:
* **Latency Anomaly Engine**: Computes rolling arithmetic mean ($\mu$) and sample standard deviation ($\sigma$). Latency anomalies trigger if current latency exceeds $\mu + 2\sigma$. In zero-variance baselines, it falls back to $5 \times \mu$.
* **Error Rate Anomaly Engine**: Evaluates trailing `ERROR_WINDOW` logs (50 requests) and splits them into disjoint windows:
  * **Historical Baseline Window**: `window[:-10]` (40 logs preceding current state).
  * **Recent State Window**: `window[-10:]` (last 10 logs).
  * Discarding overlapping or cumulative windows, an error rate anomaly triggers only if `current_rate` exceeds $5\%$ (`ERROR_RATE_THRESHOLD`) OR `current_rate > baseline_rate + 10pp` (`ERROR_RATE_DELTA`).
* **Deterministic Severity Scoring**:
  * **Latency**: Ratio $\ge 10 \rightarrow$ `CRITICAL`, $\ge 5 \rightarrow$ `HIGH`, $\ge 2 \rightarrow$ `WARNING`.
  * **Error Rate**: Rate $\ge 20\% \rightarrow$ `CRITICAL`, $\ge 10\% \rightarrow$ `HIGH`, $\ge 5\% \rightarrow$ `WARNING`.

### 🔗 Stage 3: Chronological Grouper (`grouper.py`)
Clusters multi-service anomalies using $O(N \log N)$ sorting and $O(N)$ sliding windows:
* Avoids expensive nested loops by arranging anomalies chronologically.
* Groups failures occurring within a 120-second delta window.
* Generates deterministic, unique `group_id` signatures using SHA-1 hashing.

### 🧠 Stage 4: Diagnostics Analyzer (`analyzer.py`)
Enriches grouped alerts with root causes and recommended checks:
* **Active LLM Integration**: Connects to the **Google Gemini API (`gemini-2.0-flash`)** to dynamically evaluate telemetry signals and generate contextual root causes.
* **Air-Gapped Local Fallback**: If Gemini credentials are empty, rate-limited, or offline, it activates localized diagnostic templates. This includes dynamically rewriting primary causes to warn of shared dependency degradation if co-occurring failures are flagged.

### 📊 Stage 5: Incident Reporter (`reporter.py`)
Writes standard, machine-readable JSON alerts (`alert.json`) and prints a clean CLI console summary.

---

## 🎨 Interactive Synthwave Next.js Client

The frontend client acts as a high-fidelity workspace:

* **Real-time Scrolling Live Telemetry**: A custom scrolling waveform canvas visualizing API latency spikes, baselines, and errors.
* **Interactive Dependency Topology Map**: A dynamic SVG SVG map mapping VPC-Gateways and service nodes (`auth-service`, `payment-api`, `order-api`). Degraded nodes glow, pulse, and display live diagnostic descriptions upon failure.
* **JSON Log Paste Board**: Monospace raw paste area featuring a **debouced JSON validator** providing instant state badges: `Awaiting Input`, `Valid Format`, `Partial Warning`, and `Invalid Format`.
* **Playbook Action Checklist**: Actionable checkboxes for SREs to check off validation checks, including one-click clipboard copying for terminal commands.
* **Dual-Source Engine Badges**: Navbar and hero status badges that dynamically prioritize and render exactly one active engine status (`Gemini Engine` $\rightarrow$ `Claude Engine` $\rightarrow$ `Offline Engine`).
* **Raw Output Modal**: A beautiful, translucent raw output modal showing the contents of `alert.json` in high-contrast **pure white text** on a solid black container.

---

## 🚀 Installation & Developer Setup

Set up your local diagnostics loop in under two minutes:

### 1. Prerequisite Installations
Ensure Python 3.10+ and Node.js 18+ are installed.

### 2. Backend FastAPI Setup
Clone the repository, install Python packages, and boot the API server:
```bash
# Navigate to the workspace root directory
cd api-failure-agent

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI bridge
python main.py
```
*The FastAPI server will boot at `http://127.0.0.1:8000`.*

### 3. Frontend Next.js Setup
Install the Node dependencies and start the development server:
```bash
# Navigate to the frontend workspace
cd frontend

# Install package modules
npm install

# Start Next.js dev server
npm run dev
```
*The SRE dashboard is now live at `http://localhost:3000`.*

---

## 🔑 Configuring Your Gemini API Key

To enable live AI root-cause diagnostics:
1. Copy `.env.example` to `.env` in the project root:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and paste your free key from Google AI Studio:
   ```env
   GEMINI_API_KEY=your_key_here
   ```

*Note: The agent utilizes the modern `gemini-2.0-flash` model. If no API key is specified, it seamlessly triggers the offline engine with zero latency or performance penalties.*

---

## 🧪 Robustness Verification & Test Harness

Agent Shastra includes a robust test runner (`test_detector.py`) verifying 13 distinct edge cases and reliability gates. 

### Running the Test Suite:
```bash
python test_detector.py
```

### Verified Test Cases:
* **Test 1**: Normal logs (0 anomalies triggered).
* **Test 2**: Latency spike logs (detects 1 critical spike).
* **Test 3**: Error rate spike logs (detects disjoint error window with 50% failures).
* **Test 4**: Multi-endpoint logs (isolates payment noise, targets degraded auth endpoint).
* **Test 5**: Under-sampled logs (gracefully bypasses small windows).
* **Test 6**: Baseline isolation (verifies zero leakage of spikes back into baseline mean).
* **Test 7**: Single outlier (3x spike maps to `WARNING`).
* **Test 8**: 50% malformed files (skips corrupt lines, audits valid rows cleanly).
* **Test 9**: Noisy baseline variance (prevents false positives on oscillating networks).
* **Scenario A**: 40 healthy logs, followed by 10 failures (Baseline $\approx 0\%$, Current $\approx 100\%$, Severity: `CRITICAL`).
* **Scenario B**: Old failures, recent healthy (Historical logs recovered $\rightarrow$ No alert generated).
* **Scenario C**: Alternating 200ms/500ms baseline followed by 1000ms spike (produces realistic `WARNING` severity).
* **Scenario D**: Latency unaffected (stable latencies $\rightarrow$ no false alarms).

---
## Known Limitations

- Optimized for structured JSON telemetry input.
- Root cause diagnostics are advisory and should not replace production observability tooling.
- Historical recovered incidents may intentionally not trigger alerts.
- Topology visualization currently operates at service abstraction level.
- The system explains incidents but does not modify infrastructure automatically.

## 📄 License & Ownership
Copyright © 2026 Agent Shastra. All rights reserved.

Created, developed, and owned by **Kishan Kumar** ([GitHub Profile](https://www.github.com/techwithkishan)).
