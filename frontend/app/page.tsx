"use client";

import { useState, useRef, DragEvent, useEffect, useMemo } from "react";
import {
  Upload,
  FileJson,
  Play,
  Activity,
  AlertOctagon,
  Compass,
  CheckSquare,
  Terminal,
  Download,
  Eye,
  RefreshCw,
  Copy,
  Check,
  BrainCircuit,
  Sliders,
  Server,
  Network,
  Cpu,
  Sun,
  Moon,
  BookOpen,
  CheckCircle2,
  Shield,
  Award,
  HelpCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ResultModal from "../components/ResultModal";
import AboutModal from "../components/AboutModal";
import TelemetryStream from "../components/TelemetryStream";
import { Swirl, ChromaFlow, FlutedGlass, FilmGrain } from "../components/shaders/react";
import Footer from "../components/Footer";
import CinematicIntro from "../components/CinematicIntro";

// Definition of stages
const PIPELINE_STEPS = [
  { id: 1, label: "Parsing Logs", desc: "Loading JSON array and validating strict ISO-8601 formatting" },
  { id: 2, label: "Detecting Latency Spikes", desc: "Calculating running baselines (mean & std dev) with isolation guards" },
  { id: 3, label: "Grouping Incidents", desc: "Clustering anomalies chronologically in O(N log N) sliding-window" },
  { id: 4, label: "AI Diagnosing Root Causes", desc: "Enriching incident context using Gemini/Claude or Offline engine" },
  { id: 5, label: "Generating Incident Report", desc: "Rolling up metrics and writing final alert.json payload" }
];

// Presets data for instant mock simulations
const PRESETS = {
  normal: {
    name: "Normal Baseline (Healthy)",
    desc: "Steady response codes and low latencies across all API gateways.",
    endpoint: "normal.json",
    data: [
      { "timestamp": "2024-06-15T10:00:00Z", "endpoint": "/payment/process", "status": 200, "latency_ms": 100.5, "service": "payment-api" },
      { "timestamp": "2024-06-15T10:00:05Z", "endpoint": "/auth/login", "status": 200, "latency_ms": 45.2, "service": "auth-service" },
      { "timestamp": "2024-06-15T10:01:00Z", "endpoint": "/payment/process", "status": 200, "latency_ms": 102.3, "service": "payment-api" },
      { "timestamp": "2024-06-15T10:01:05Z", "endpoint": "/auth/login", "status": 200, "latency_ms": 47.1, "service": "auth-service" },
      { "timestamp": "2024-06-15T10:02:00Z", "endpoint": "/payment/process", "status": 200, "latency_ms": 99.1, "service": "payment-api" },
      { "timestamp": "2024-06-15T10:02:05Z", "endpoint": "/auth/login", "status": 200, "latency_ms": 46.8, "service": "auth-service" },
      { "timestamp": "2024-06-15T10:03:00Z", "endpoint": "/payment/process", "status": 200, "latency_ms": 101.4, "service": "payment-api" },
      { "timestamp": "2024-06-15T10:03:05Z", "endpoint": "/auth/login", "status": 200, "latency_ms": 44.9, "service": "auth-service" },
      { "timestamp": "2024-06-15T10:04:00Z", "endpoint": "/payment/process", "status": 200, "latency_ms": 98.7, "service": "payment-api" },
      { "timestamp": "2024-06-15T10:04:05Z", "endpoint": "/auth/login", "status": 200, "latency_ms": 45.6, "service": "auth-service" }
    ]
  },
  latency: {
    name: "Payment Latency Spike (Critical)",
    desc: "Simulates /payment/process leaking database pool limits, leaping to 2500ms.",
    endpoint: "latency_spike.json",
    data: [
      { "timestamp": "2024-06-15T10:00:00Z", "endpoint": "/payment/process", "status": 200, "latency_ms": 100.2, "service": "payment-api" },
      { "timestamp": "2024-06-15T10:01:00Z", "endpoint": "/payment/process", "status": 200, "latency_ms": 101.5, "service": "payment-api" },
      { "timestamp": "2024-06-15T10:02:00Z", "endpoint": "/payment/process", "status": 200, "latency_ms": 99.8, "service": "payment-api" },
      { "timestamp": "2024-06-15T10:03:00Z", "endpoint": "/payment/process", "status": 200, "latency_ms": 98.5, "service": "payment-api" },
      { "timestamp": "2024-06-15T10:04:00Z", "endpoint": "/payment/process", "status": 200, "latency_ms": 100.9, "service": "payment-api" },
      { "timestamp": "2024-06-15T10:05:00Z", "endpoint": "/payment/process", "status": 200, "latency_ms": 102.1, "service": "payment-api" },
      { "timestamp": "2024-06-15T10:06:00Z", "endpoint": "/payment/process", "status": 200, "latency_ms": 99.4, "service": "payment-api" },
      { "timestamp": "2024-06-15T10:07:00Z", "endpoint": "/payment/process", "status": 200, "latency_ms": 100.6, "service": "payment-api" },
      { "timestamp": "2024-06-15T10:08:00Z", "endpoint": "/payment/process", "status": 200, "latency_ms": 101.2, "service": "payment-api" },
      { "timestamp": "2024-06-15T10:09:00Z", "endpoint": "/payment/process", "status": 200, "latency_ms": 98.9, "service": "payment-api" },
      { "timestamp": "2024-06-15T10:10:00Z", "endpoint": "/payment/process", "status": 200, "latency_ms": 2500.0, "service": "payment-api" }
    ]
  },
  error: {
    name: "Auth Service Error Spike (Warning)",
    desc: "Simulates an auth deployment bug, generating trailing 500 status codes.",
    endpoint: "error_rate.json",
    data: [
      { "timestamp": "2024-06-15T10:00:00Z", "endpoint": "/auth/login", "status": 200, "latency_ms": 45.0, "service": "auth-service" },
      { "timestamp": "2024-06-15T10:01:00Z", "endpoint": "/auth/login", "status": 200, "latency_ms": 46.1, "service": "auth-service" },
      { "timestamp": "2024-06-15T10:02:00Z", "endpoint": "/auth/login", "status": 200, "latency_ms": 44.8, "service": "auth-service" },
      { "timestamp": "2024-06-15T10:03:00Z", "endpoint": "/auth/login", "status": 200, "latency_ms": 45.5, "service": "auth-service" },
      { "timestamp": "2024-06-15T10:04:00Z", "endpoint": "/auth/login", "status": 200, "latency_ms": 44.9, "service": "auth-service" },
      { "timestamp": "2024-06-15T10:05:00Z", "endpoint": "/auth/login", "status": 200, "latency_ms": 45.2, "service": "auth-service" },
      { "timestamp": "2024-06-15T10:06:00Z", "endpoint": "/auth/login", "status": 200, "latency_ms": 46.0, "service": "auth-service" },
      { "timestamp": "2024-06-15T10:07:00Z", "endpoint": "/auth/login", "status": 200, "latency_ms": 45.7, "service": "auth-service" },
      { "timestamp": "2024-06-15T10:08:00Z", "endpoint": "/auth/login", "status": 200, "latency_ms": 44.5, "service": "auth-service" },
      { "timestamp": "2024-06-15T10:09:00Z", "endpoint": "/auth/login", "status": 200, "latency_ms": 45.1, "service": "auth-service" },
      { "timestamp": "2024-06-15T10:10:00Z", "endpoint": "/auth/login", "status": 500, "latency_ms": 48.0, "service": "auth-service" },
      { "timestamp": "2024-06-15T10:10:15Z", "endpoint": "/auth/login", "status": 500, "latency_ms": 47.5, "service": "auth-service" },
      { "timestamp": "2024-06-15T10:10:25Z", "endpoint": "/auth/login", "status": 500, "latency_ms": 48.2, "service": "auth-service" },
      { "timestamp": "2024-06-15T10:10:35Z", "endpoint": "/auth/login", "status": 500, "latency_ms": 47.9, "service": "auth-service" },
      { "timestamp": "2024-06-15T10:10:45Z", "endpoint": "/auth/login", "status": 500, "latency_ms": 48.1, "service": "auth-service" }
    ]
  }
};

// Stagger animation container for premium title entrance
const TITLE_CONTAINER_VARIANTS = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const TITLE_WORD_VARIANTS = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      damping: 12,
      stiffness: 90,
    },
  },
};

function debounce<T extends (...args: any[]) => void>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return function(this: any, ...args: Parameters<T>) {
    const context = this;
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}

export default function Home() {
  // Dark/Light Theme state
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  // Cinematic Intro preloader state
  const [showIntro, setShowIntro] = useState(true);
  const [startHomeAnimations, setStartHomeAnimations] = useState(false);

  // Typewriter animation state for hero description
  const fullHeroText = "Audit telemetry log structures in real-time. Compute dynamic standard deviation thresholds, aggregate correlated endpoints, and diagnose SRE metrics with fallback certainty.";
  const [typedHeroText, setTypedHeroText] = useState("");
  const [isTypingComplete, setIsTypingComplete] = useState(false);

  useEffect(() => {
    if (!startHomeAnimations) return;

    // Delay the typewriter so it starts right after the main headline stagger animation completes
    const delayTimer = setTimeout(() => {
      let index = 0;
      const interval = setInterval(() => {
        if (index <= fullHeroText.length) {
          setTypedHeroText(fullHeroText.slice(0, index));
          index += 3; // 3 characters at a time for quicker rendering
        } else {
          setTypedHeroText(fullHeroText);
          setIsTypingComplete(true);
          clearInterval(interval);
        }
      }, 16); // 16ms is extremely smooth and frames-aligned
      return () => clearInterval(interval);
    }, 700);

    return () => clearTimeout(delayTimer);
  }, [startHomeAnimations]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
    }
  }, [theme]);

  // Upload and state management
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "dragging" | "processing" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [presetSelected, setPresetSelected] = useState<string | null>(null);
  const [uploadMethod, setUploadMethod] = useState<"file" | "paste">("file");
  const [pastedJson, setPastedJson] = useState("");
  const [validation, setValidation] = useState<{
    status: "empty" | "valid" | "warning" | "invalid";
    message: string;
  }>({ status: "empty", message: "" });

  // Real-time scrolling telemetry waveform graph
  // Pipeline loading sequence state
  const [currentStep, setCurrentStep] = useState(0);
  const [pipelineFinished, setPipelineFinished] = useState(false);

  // Result state
  const [result, setResult] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedActionIdx, setCopiedActionIdx] = useState<number | null>(null);
  const [checkedActions, setCheckedActions] = useState<boolean[]>([]);

  // retro console logs list
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [isResetting, setIsResetting] = useState(false);



  // Terminal logging simulator mapping pipeline steps
  useEffect(() => {
    if (status !== "processing") return;
    setConsoleLogs([]);

    const logMessages = [
      "[SYS] Initializing SRE diagnostics kernel...",
      "[STAGE 1] Loading logs buffer...",
      "[STAGE 1] Validating strict ISO-8601 timestamp formats...",
      "[STAGE 1] Success: 0 syntax violations found.",
      "[STAGE 2] Building chronological baseline telemetry map...",
      "[STAGE 2] Checking trailing standard deviation boundaries...",
      "[STAGE 2] Metric check complete.",
      "[STAGE 3] Performing O(N) sliding-window correlation search...",
      "[STAGE 3] Analysing 120-second delta frames...",
      "[STAGE 4] Firing Diagnostic Analyzer (Gemini fallback mode)...",
      "[STAGE 4] Resolving symptoms to safe dependency descriptors...",
      "[STAGE 5] Chaining report rollups...",
      "[SUCCESS] alert.json payload saved successfully."
    ];

    let logIdx = 0;
    const interval = setInterval(() => {
      if (logIdx < logMessages.length) {
        setConsoleLogs((prev) => [...prev, logMessages[logIdx]]);
        logIdx++;
      } else {
        clearInterval(interval);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [status]);

  // Auto-progress pipeline steps when processing is active
  useEffect(() => {
    if (status !== "processing") return;

    let stepTimer: NodeJS.Timeout;

    const progressStep = (step: number) => {
      if (step < PIPELINE_STEPS.length) {
        setCurrentStep(step + 1);
        const durations = [1000, 1200, 1000, 1500, 800];
        stepTimer = setTimeout(() => progressStep(step + 1), durations[step]);
      } else {
        setPipelineFinished(true);
      }
    };

    progressStep(0);
    return () => clearTimeout(stepTimer);
  }, [status]);

  // Clean success page trigger once both backend API and loading pipeline are finished
  useEffect(() => {
    if (pipelineFinished && result) {
      if (result.success) {
        setStatus("success");
      } else {
        setStatus("error");
        setErrorMessage(result.message || "An error occurred during analysis.");
      }
    }
  }, [pipelineFinished, result]);

  // Drag handlers
  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
      setStatus("dragging");
    } else if (e.type === "dragleave") {
      setDragActive(false);
      setStatus("idle");
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith(".json")) {
        setFile(droppedFile);
        setPresetSelected(null);
        setStatus("idle");
        setErrorMessage("");
      } else {
        setStatus("error");
        setErrorMessage("Only .json format API logs are supported.");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.name.endsWith(".json")) {
        setFile(selectedFile);
        setPresetSelected(null);
        setStatus("idle");
        setErrorMessage("");
      } else {
        setStatus("error");
        setErrorMessage("Only .json format API logs are supported.");
      }
    }
  };

  const handleZoneClick = () => {
    fileInputRef.current?.click();
  };

  const formatFailureType = (type: string): string => {
    if (type === "latency_spike") return "Latency Spike";
    if (type === "error_rate_spike") return "Error Rate Spike";
    return type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  };

  const getActiveSourceLabel = (): string => {
    if (result && result.incidents && result.incidents.length > 0) {
      const firstIncident = result.incidents[0];
      const causes = firstIncident.likely_causes || [];
      if (causes.length > 0) {
        const firstCause = causes[0].toLowerCase();
        if (
          firstCause.includes("database connection pool") ||
          firstCause.includes("recent deployment introduced") ||
          firstCause.includes("shared dependency degradation")
        ) {
          return "Offline Engine";
        }
        if (firstCause.includes("claude") || firstCause.includes("anthropic")) {
          return "Claude Engine";
        }
      }
      return "Gemini Engine";
    }
    return "Gemini Engine";
  };

  const validatePastedJson = (text: string): { status: "empty" | "valid" | "warning" | "invalid"; message: string } => {
    if (!text.trim()) 
      return { status: "empty", message: "" };

    let parsed: any;
    try { 
      parsed = JSON.parse(text);
    } catch (e: any) { 
      return { status: "invalid", message: `Syntax error: ${e.message}` };
    }

    if (!Array.isArray(parsed))
      return { status: "invalid", message: "Must be a JSON array [ ... ]" };

    if (parsed.length === 0)
      return { status: "invalid", message: "Array is empty" };

    // Field presence check — warn, don't block
    const REQUIRED = ["timestamp", "endpoint", "status", "latency_ms"];
    const validEntries = parsed.filter((entry: any) =>
      entry && typeof entry === "object" && REQUIRED.every(f => f in entry)
    );

    if (validEntries.length === 0)
      return { status: "invalid", message: "No entries contain required fields (timestamp, endpoint, status, latency_ms)" };

    if (validEntries.length < parsed.length)
      return { 
        status: "warning", 
        message: `${validEntries.length}/${parsed.length} entries valid — others will be skipped` 
      };

    return { status: "valid", message: `${parsed.length} entries ready` };
  };

  // 300ms debounce on the onChange handler
  const debouncedValidate = useMemo(
    () => debounce((text: string) => {
      const result = validatePastedJson(text);
      setValidation(result);
    }, 300),
    []
  );

  // Preloads production preset simulations instantly
  const handleSelectPreset = (key: "normal" | "latency" | "error") => {
    const preset = PRESETS[key];
    const blob = new Blob([JSON.stringify(preset.data, null, 2)], { type: "application/json" });
    const dummyFile = new File([blob], preset.endpoint, { type: "application/json" });

    setUploadMethod("file");
    setFile(dummyFile);
    setPresetSelected(key);
    setErrorMessage("");
    setStatus("idle");
  };

  // Triggers API Call to FastAPI backend
  const handleAnalyze = async (fileToUse?: File) => {
    // Empty state guard
    if (uploadMethod === "paste" && !pastedJson.trim()) {
      setErrorMessage("Please paste logs before running analysis.");
      return;
    }

    // Duplicate request guard
    if (status === "processing") return;

    let activeFile = fileToUse || file;

    if (uploadMethod === "paste") {
      const result = validatePastedJson(pastedJson);
      if (result.status === "invalid") {
        setErrorMessage(result.message || "Please input valid JSON array logs.");
        return;
      }
      const blob = new Blob([pastedJson], { type: "application/json" });
      activeFile = new File([blob], "raw_pasted_logs.json", { type: "application/json" });
      setFile(activeFile);
    }

    if (!activeFile) return;

    // Cancel any current in-flight request
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setStatus("processing");
    setCurrentStep(0);
    setPipelineFinished(false);
    setResult(null);

    const formData = new FormData();
    formData.append("file", activeFile);

    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL ||
      (typeof window !== "undefined" && window.location.hostname === "localhost" && window.location.port === "3000"
        ? "http://127.0.0.1:8000"
        : "");

    try {
      const response = await fetch(`${apiUrl}/analyze`, {
        method: "POST",
        body: formData,
        signal: abortControllerRef.current.signal,
      });

      const data = await response.json();
      setResult(data);

      if (data.success && data.incidents) {
        const totalActionsCount = data.incidents.reduce(
          (acc: number, inc: any) => acc + (inc.recommended_actions?.length || 0),
          0
        );
        setCheckedActions(new Array(totalActionsCount).fill(false));
      }
    } catch (err: any) {
      // Gracefully exit if this call was aborted programmatically
      if (err.name === "AbortError") return;

      console.error(err);
      setResult({
        success: false,
        message: "Backend server not reachable. Please verify that the API server is running and accessible.",
      });
    }
  };

  const handleReset = () => {
    // cancel request if mid-flight
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;

    setIsResetting(true);

    setTimeout(() => {
      setFile(null);
      setStatus("idle");
      setPresetSelected(null);
      setResult(null);
      setCurrentStep(0);
      setPipelineFinished(false);
      setErrorMessage("");
      setUploadMethod("paste"); // return to paste tab
      setPastedJson("");
      setValidation({ status: "empty", message: "" });
      setIsResetting(false);

      // Focus textarea
      setTimeout(() => textareaRef.current?.focus(), 10);
    }, 200);
  };

  const handleCopyAction = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedActionIdx(index);
    setTimeout(() => setCopiedActionIdx(null), 2000);
  };

  const toggleCheckAction = (index: number) => {
    const updated = [...checkedActions];
    updated[index] = !updated[index];
    setCheckedActions(updated);
  };

  const downloadReport = () => {
    if (!result) return;
    const cleanResult = { ...result };
    delete cleanResult.success;

    const blob = new Blob([JSON.stringify(cleanResult, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `alert-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Custom node state triggers for SRE Topology graph
  const isPaymentFailed = status === "success" && result?.total_incidents > 0 && result.incidents.some((inc: any) => inc.endpoint.includes("payment"));
  const isAuthFailed = status === "success" && result?.total_incidents > 0 && result.incidents.some((inc: any) => inc.endpoint.includes("auth"));

  return (
    <>
      <AnimatePresence mode="wait">
        {showIntro && (
          <CinematicIntro onComplete={() => {
            setShowIntro(false);
            setStartHomeAnimations(true);
          }} />
        )}
      </AnimatePresence>

      <div className={`relative min-h-screen transition-colors duration-300 font-sans antialiased ${theme === "dark"
          ? "bg-[#040406] text-neutral-200 selection:bg-neutral-800 selection:text-white"
          : "bg-slate-50 text-slate-800 selection:bg-slate-200 selection:text-slate-900"
        }`}>

      {/* FULL-PAGE ANIMATED GRID BACKGROUND */}
      <div
        className="fixed inset-0 z-0 pointer-events-none animate-grid-move transition-all"
        style={{
          backgroundColor: theme === "dark" ? "#040406" : "#f8fafc",
          opacity: 1,
          backgroundImage: theme === "dark"
            ? `linear-gradient(to right, rgba(99, 102, 241, 0.12) 1px, transparent 1px),
               linear-gradient(to bottom, rgba(99, 102, 241, 0.12) 1px, transparent 1px)`
            : `linear-gradient(to right, rgba(99, 102, 241, 0.14) 1px, transparent 1px),
               linear-gradient(to bottom, rgba(99, 102, 241, 0.14) 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }}
      />

      {/* Floating deep backdrop glowing blobs — fixed so they stay full-page */}
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#4f46e5]/10 rounded-full blur-[180px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#ef4444]/6 rounded-full blur-[180px] pointer-events-none z-0" />
      <div className="fixed top-[40%] left-[30%] w-[35%] h-[35%] bg-indigo-500/5 rounded-full blur-[160px] pointer-events-none z-0" />

      {/* HEADER NAVBAR */}
      <header className={`relative z-10 border-b transition-all duration-300 backdrop-blur-md ${theme === "dark"
          ? "border-neutral-900/60 bg-[#040406]/65"
          : "border-slate-200 bg-white/80 shadow-sm"
        }`}>
        <div className="mx-auto max-w-7xl flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-indigo-500/10 p-1 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <svg
                  viewBox="0 0 160 120"
                  className="w-6 h-6 text-indigo-500 dark:text-indigo-400 fill-current drop-shadow-[0_0_8px_rgba(99,102,241,0.2)]"
                >
                  <path
                    d="M 35 105 C 35 105, 52 38, 55 25 C 57 18, 62 14, 67 14 C 70 14, 73 16, 75 20 L 89 65 L 51 65 L 47 80 L 93 80 L 100 105"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M 98 94 C 112 94, 126 94, 132 88 C 138 82, 138 72, 132 66 C 124 58, 102 62, 94 54 C 88 48, 88 38, 94 32 C 100 26, 114 26, 128 26"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="flex flex-col text-left leading-none">
                <span className={`text-xs font-semibold tracking-wider uppercase ${theme === "dark" ? "text-neutral-200" : "text-slate-900"
                  }`}
                  style={{ fontFamily: 'var(--font-accent)' }}
                >
                  Agent Shastra
                </span>
                <span className={`text-[9px] tracking-widest mt-1 ${theme === "dark" ? "text-neutral-600" : "text-slate-400"
                  }`}
                  style={{ fontFamily: 'var(--font-accent)' }}
                >
                  KERNEL STAGE V1.0.3
                </span>
              </div>
            </div>

            {/* Developer Navigation Tabs */}
            <nav className="hidden xl:flex items-center gap-5 text-[10px] border-l border-neutral-800/60 dark:border-neutral-850/60 light:border-slate-200 pl-5 leading-none mt-0.5"
              style={{ fontFamily: 'var(--font-accent)' }}
            >
              <button
                onClick={() => scrollToSection("about-section")}
                className={`hover:text-indigo-400 cursor-pointer transition-colors tracking-widest uppercase ${theme === "dark" ? "text-neutral-400" : "text-slate-600"
                  }`}
              >
                About Agent Shastra
              </button>
            </nav>
          </div>

          {/* Quick preset selector directly inside the Navbar header */}
          <div className="hidden lg:flex items-center gap-3">
            <span className="text-[10px] text-neutral-500 uppercase tracking-widest" style={{ fontFamily: 'var(--font-accent)' }}>Load Preset:</span>
            <button
              onClick={() => handleSelectPreset("normal")}
              style={{ fontFamily: 'var(--font-accent)' }}
              className={`rounded border px-2.5 py-1 text-xs transition-all cursor-pointer tracking-wide ${presetSelected === "normal"
                  ? theme === "dark"
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-400 font-semibold"
                    : "border-emerald-600 bg-emerald-50 text-emerald-700 font-semibold"
                  : theme === "dark"
                    ? "border-neutral-800 bg-neutral-900/40 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200"
                    : "border-slate-200 bg-slate-100 text-slate-600 hover:border-slate-350 hover:text-slate-900"
                }`}
            >
              Normal Logs
            </button>
            <button
              onClick={() => handleSelectPreset("latency")}
              style={{ fontFamily: 'var(--font-accent)' }}
              className={`rounded border px-2.5 py-1 text-xs transition-all cursor-pointer tracking-wide ${presetSelected === "latency"
                  ? theme === "dark"
                    ? "border-red-500 bg-red-500/10 text-red-400 font-semibold"
                    : "border-red-600 bg-red-50 text-red-700 font-semibold"
                  : theme === "dark"
                    ? "border-neutral-800 bg-neutral-900/40 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200"
                    : "border-slate-200 bg-slate-100 text-slate-600 hover:border-slate-350 hover:text-slate-900"
                }`}
            >
              Latency Spike
            </button>
            <button
              onClick={() => handleSelectPreset("error")}
              style={{ fontFamily: 'var(--font-accent)' }}
              className={`rounded border px-2.5 py-1 text-xs transition-all cursor-pointer tracking-wide ${presetSelected === "error"
                  ? theme === "dark"
                    ? "border-amber-500 bg-amber-500/10 text-amber-400 font-semibold"
                    : "border-amber-600 bg-amber-50 text-amber-700 font-semibold"
                  : theme === "dark"
                    ? "border-neutral-800 bg-neutral-900/40 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200"
                    : "border-slate-200 bg-slate-100 text-slate-600 hover:border-slate-350 hover:text-slate-900"
                }`}
            >
              Error Spike
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs" style={{ fontFamily: 'var(--font-accent)' }}>
            {status === "success" && (
              <button
                onClick={handleReset}
                className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 transition-colors cursor-pointer tracking-wide ${theme === "dark"
                    ? "border-neutral-800 bg-neutral-900 text-neutral-400 hover:bg-neutral-850 hover:text-neutral-100"
                    : "border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                  }`}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Reset Sandbox</span>
              </button>
            )}

            {/* About Guide Button */}
            <button
              onClick={() => scrollToSection("about-section")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border transition-colors cursor-pointer tracking-wide ${theme === "dark"
                  ? "border-neutral-800 bg-neutral-900 text-neutral-400 hover:bg-neutral-850 hover:text-neutral-200"
                  : "border-slate-200 bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800"
                }`}
              title="Scroll to SRE Kernel About & FAQs"
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">About</span>
            </button>

            {/* Dark / Light Mode Toggler */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className={`flex items-center justify-center p-2 rounded-md border transition-colors cursor-pointer ${theme === "dark"
                  ? "border-neutral-800 bg-neutral-900 text-neutral-400 hover:bg-neutral-850 hover:text-neutral-200"
                  : "border-slate-200 bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800"
                }`}
              title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
            >
              {theme === "dark" ? (
                <Sun className="h-3.5 w-3.5 text-amber-400" />
              ) : (
                <Moon className="h-3.5 w-3.5 text-indigo-500" />
              )}
            </button>

            <span className={`px-2.5 py-1 rounded-full border text-[10px] shadow-inner transition-colors duration-300 tracking-wider ${theme === "dark"
                ? "border-neutral-800/40 bg-neutral-900/80 text-neutral-400"
                : "border-slate-200 bg-slate-100 text-slate-500"
              }`}>
              {getActiveSourceLabel()}
            </span>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main id="dashboard-section" className="relative z-10 mx-auto max-w-7xl px-6 py-12 flex flex-col lg:flex-row gap-10 items-start justify-center">

        {/* LEFT COLUMN: HERO, DRAG ZONE & SRE GRAPH TOPOLOGY MAP */}
        <div className="w-full lg:w-3/5 flex flex-col gap-8">

          {/* HERO SECTION */}
          <section className="text-left">
            <div className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] tracking-widest uppercase mb-6 ${theme === "dark"
                ? "border-indigo-500/15 bg-indigo-500/5 text-indigo-400"
                : "border-indigo-200 bg-indigo-50 text-indigo-700"
              }`}
              style={{ fontFamily: 'var(--font-accent)' }}
            >
              <BrainCircuit className="h-3.5 w-3.5 animate-pulse" />
              <span>
                {getActiveSourceLabel() === "Offline Engine"
                  ? "Offline Diagnostics Engine"
                  : getActiveSourceLabel() === "Claude Engine"
                    ? "Claude Diagnostics Engine"
                    : "Gemini Diagnostics Engine"}
              </span>
            </div>

            <motion.h1
              variants={TITLE_CONTAINER_VARIANTS}
              initial="hidden"
              animate={startHomeAnimations ? "visible" : "hidden"}
              className={`text-4xl font-bold tracking-tight sm:text-5xl bg-gradient-to-b bg-clip-text text-transparent leading-tight transition-all duration-300 flex flex-wrap gap-x-2 md:gap-x-3.5 ${theme === "dark"
                  ? "from-white via-neutral-100 to-neutral-500"
                  : "from-slate-900 via-slate-800 to-slate-500"
                }`}
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              {["API", "Failure", "Detection", "&", "Debugging", "Agent"].map((word, wIdx) => {
                const isAccent = word === "&" || word === "Agent";
                return (
                  <motion.span
                    key={wIdx}
                    variants={TITLE_WORD_VARIANTS}
                    className={`inline-block ${isAccent ? "italic font-medium tracking-wide text-indigo-500 dark:text-indigo-400" : ""
                      }`}
                  >
                    {word}
                  </motion.span>
                );
              })}
            </motion.h1>
            <p
              className={`mt-4 text-sm leading-relaxed max-w-xl transition-colors duration-300 ${theme === "dark"
                  ? "text-neutral-400"
                  : "text-slate-600"
                }`}
              style={{
                fontFamily: "var(--font-sans)",
              }}
            >
              {typedHeroText}
              {!isTypingComplete && (
                <span className="inline-block w-1.5 h-4 ml-1 bg-indigo-500 animate-pulse align-middle" />
              )}
            </p>
          </section>

          {/* DRAG AND DROP UPLOAD ZONE */}
            <section className="w-full">
              {/* Sleek Premium Tab Switcher */}
              <div className="flex border-b border-neutral-250 dark:border-neutral-800 mb-6 gap-6 text-xs" style={{ fontFamily: 'var(--font-accent)' }}>
                <button
                  type="button"
                  onClick={() => setUploadMethod("file")}
                  className={`pb-3 px-1 border-b-2 font-semibold tracking-wider transition-all duration-300 cursor-pointer uppercase ${
                    uploadMethod === "file"
                      ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                      : "border-transparent text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-350"
                  }`}
                >
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMethod("paste")}
                  className={`pb-3 px-1 border-b-2 font-semibold tracking-wider transition-all duration-300 cursor-pointer uppercase ${
                    uploadMethod === "paste"
                      ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                      : "border-transparent text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-350"
                  }`}
                >
                  Paste JSON Logs
                </button>
              </div>

              {uploadMethod === "file" ? (
                /* FILE UPLOAD DRAG & DROP ZONE */
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={handleZoneClick}
                  className={`relative w-full rounded-xl border border-dashed p-8 cursor-pointer transition-all duration-300 flex flex-col items-center justify-center backdrop-blur-sm ${status === "dragging"
                      ? "border-indigo-500 bg-indigo-500/5 scale-[1.01] shadow-[0_0_24px_rgba(99,102,241,0.08)]"
                      : theme === "dark"
                        ? "border-neutral-800/80 bg-neutral-950/20 hover:border-neutral-700 hover:bg-neutral-900/10 animate-border-glow"
                        : "border-slate-300 bg-white hover:border-indigo-400 hover:bg-indigo-50/10 animate-border-glow shadow-sm"
                    }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleFileChange}
                  />

                  <div className={`rounded-full p-3 border text-neutral-400 ${theme === "dark" ? "bg-neutral-900/80 border-neutral-800" : "bg-slate-100 border-slate-200"
                    }`}>
                    {file ? (
                      <FileJson className="h-6 w-6 text-indigo-400" />
                    ) : (
                      <Upload className="h-6 w-6 text-neutral-500" />
                    )}
                  </div>

                  {file ? (
                    <div className="mt-3 text-center">
                      <p className={`text-sm font-mono font-medium ${theme === "dark" ? "text-neutral-200" : "text-slate-800"
                        }`}>{file.name}</p>
                      <p className={`text-xs mt-1 font-mono ${theme === "dark" ? "text-neutral-500" : "text-slate-400"
                        }`}>{(file.size / 1024).toFixed(2)} KB</p>
                    </div>
                  ) : (
                    <div className="mt-3 text-center">
                      <p className={`text-sm ${theme === "dark" ? "text-neutral-300" : "text-slate-600"}`}>
                        Drag & drop your <span className={`font-mono text-xs ${theme === "dark" ? "text-neutral-400" : "text-slate-700"
                          }`}>.json</span> log file, or <span className="text-indigo-600 dark:text-indigo-400 font-medium">browse</span>
                      </p>
                      <p className={`text-xs mt-1.5 ${theme === "dark" ? "text-neutral-500" : "text-slate-400"}`}>
                        JSON Array format with timestamps required
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                /* 🟢 EXTRAORDINARY UX: MONOSPACE RAW JSON PASTE ZONE WITH DEBOUNCED VALIDATOR & DRIVE STATUS */
                <div className="relative w-full">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500" style={{ fontFamily: "var(--font-accent)" }}>
                      Log Paste Board
                    </h3>
                    
                    {/* Multi-State Premium Badges */}
                    {validation.status === "empty" && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium border border-neutral-700 bg-neutral-900/40 text-neutral-400">
                        <Activity className="h-3 w-3 animate-pulse text-neutral-500" />
                        <span>Awaiting Input</span>
                      </span>
                    )}

                    {validation.status === "invalid" && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold border border-red-500/20 bg-red-550/10 text-red-500 dark:text-red-400">
                        <AlertOctagon className="h-3 w-3 animate-bounce" />
                        <span>Invalid Format</span>
                      </span>
                    )}

                    {validation.status === "warning" && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold border border-amber-500/20 bg-amber-550/10 text-amber-600 dark:text-amber-400">
                        <AlertOctagon className="h-3 w-3" />
                        <span>Partial Format Warning</span>
                      </span>
                    )}

                    {validation.status === "valid" && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border border-emerald-500/20 bg-emerald-550/10 text-emerald-600 dark:text-emerald-400">
                        <CheckSquare className="h-3 w-3" />
                        <span>Valid Format</span>
                      </span>
                    )}
                  </div>

                  <textarea
                    ref={textareaRef}
                    value={pastedJson}
                    onChange={(e) => {
                      setPastedJson(e.target.value);
                      debouncedValidate(e.target.value);
                    }}
                    placeholder={`Paste your JSON logs array here. E.g.\n[\n  {\n    "timestamp": "2024-06-15T10:00:00Z",\n    "endpoint": "/payment/process",\n    "status": 200,\n    "latency_ms": 100.5,\n    "service": "payment-api"\n  }\n]`}
                    className={`w-full h-48 rounded-xl border p-4 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all duration-300 ${
                      theme === "dark"
                        ? "bg-[#040406]/60 border-neutral-850 text-neutral-200 placeholder:text-neutral-700"
                        : "bg-white border-slate-250 text-slate-800 placeholder:text-slate-450 shadow-inner"
                    }`}
                  />

                  {/* Immediate Validation Message Feed */}
                  {validation.status === "invalid" && (
                    <div className="mt-2 text-left text-[11px] text-red-500 font-mono flex items-start gap-1">
                      <AlertOctagon className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <span>{validation.message}</span>
                    </div>
                  )}

                  {validation.status === "warning" && (
                    <div className="mt-2 text-left text-[11px] text-amber-600 dark:text-amber-400 font-mono flex items-start gap-1 animate-pulse">
                      <AlertOctagon className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <span>{validation.message}</span>
                    </div>
                  )}

                  {validation.status === "valid" && (
                    <div className="mt-2 text-left text-[11px] text-emerald-600 dark:text-emerald-400 font-mono flex items-start gap-1">
                      <CheckSquare className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <span>{validation.message}</span>
                    </div>
                  )}

                  {validation.status === "empty" && (
                    <div className={`mt-2 text-left text-[11px] font-sans flex items-start gap-1.5 ${
                      theme === "dark" ? "text-neutral-500" : "text-slate-450"
                    }`}>
                      <HelpCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-neutral-400" />
                      <span>
                        Paste a valid <strong className="font-semibold" style={{ fontFamily: "var(--font-serif)" }}>JSON Array</strong> payload. Telemetry records require timestamps, endpoints, status codes, and latency parameters for live diagnostics.
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Optional upload own file link below the card */}
              {uploadMethod === "file" && presetSelected && (
                <div className="mt-3 text-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleZoneClick();
                    }}
                    className={`text-xs font-mono hover:underline transition-all cursor-pointer flex items-center justify-center gap-1 mx-auto px-3 py-1.5 rounded-lg border ${theme === "dark"
                        ? "text-indigo-400 hover:text-indigo-300 bg-neutral-900/40 hover:bg-neutral-900/80 border-neutral-800/60"
                        : "text-indigo-600 hover:text-indigo-700 bg-slate-100 hover:bg-slate-200 border-slate-200"
                      }`}
                  >
                    <Upload className="h-3 w-3" />
                    <span>Upload your own log/file</span>
                  </button>
                </div>
              )}

              {/* Error banner */}
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 w-full flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-50/5 px-4 py-3 text-xs text-red-500 text-left font-mono"
                >
                  <AlertOctagon className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </motion.div>
              )}

              {/* CTA Action Button */}
              {uploadMethod === "file" ? (
                status === "idle" && file && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => handleAnalyze()}
                    className="mt-6 w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-medium py-3.5 shadow-[0_0_20px_rgba(79,70,229,0.2)] transition-all cursor-pointer border-0"
                  >
                    <Play className="h-3.5 w-3.5 fill-current" />
                    <span>Run SRE Diagnostic Loop</span>
                  </motion.button>
                )
              ) : (
                /* IN PASTE MODE: Show action row if they have inputted any text OR if status is idle */
                (pastedJson.trim() !== "" || status === "idle") && (
                  <div className="flex gap-4 mt-6">
                    {/* Clear & Reset: Always visible once there is input, regardless of success/processing status */}
                    {pastedJson.trim() !== "" && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={handleReset}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-neutral-350 dark:border-neutral-800 bg-transparent text-xs font-mono font-medium py-3.5 transition-all duration-200 cursor-pointer text-neutral-500 hover:border-red-400 hover:text-red-450 dark:hover:text-red-400 hover:shadow-[0_0_8px_rgba(248,113,113,0.3)]"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span>Clear & Reset</span>
                      </motion.button>
                    )}
                    
                    {/* Run SRE Diagnostic Loop: Only visible and active when status is idle */}
                    {status === "idle" && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={() => handleAnalyze()}
                        disabled={validation.status === "invalid" || validation.status === "empty"}
                        className={`flex-[2] flex items-center justify-center gap-2 rounded-lg font-mono text-xs font-medium py-3.5 transition-all border-0 shadow-[0_0_20px_rgba(79,70,229,0.2)] ${
                          validation.status === "invalid" || validation.status === "empty"
                            ? "bg-neutral-200 dark:bg-neutral-900 text-neutral-450 dark:text-neutral-600 cursor-not-allowed shadow-none"
                            : "bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
                        }`}
                      >
                        <Play className="h-3.5 w-3.5 fill-current" />
                        <span>Run SRE Diagnostic Loop</span>
                      </motion.button>
                    )}
                  </div>
                )
              )}
            </section>

            {/* 🟢 EXTRAORDINARY CREATIVITY: DYNAMIC SRE NODE TOPOLOGY GRAPH */}
            <section className={`relative w-full rounded-xl border p-6 backdrop-blur-sm overflow-hidden transition-all duration-300 ${theme === "dark"
                ? "border-neutral-900 bg-neutral-950/40"
                : "border-slate-200 bg-white shadow-sm"
              }`}>
              <div className={`flex items-center justify-between border-b pb-3 mb-6 ${theme === "dark" ? "border-neutral-900" : "border-slate-100"
                }`}>
                <div className="flex items-center gap-1.5">
                  <Network className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
                  <span className={`font-mono text-xs font-bold uppercase tracking-wide ${theme === "dark" ? "text-neutral-300" : "text-slate-800"
                    }`}>
                    Topology Dependency Map
                  </span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[9px] font-mono transition-colors duration-300 ${theme === "dark" ? "bg-neutral-900 text-neutral-500" : "bg-slate-100 text-slate-500"
                  }`}>
                  ACTIVE GRAPH
                </span>
              </div>

              {/* Topology SVG Layout */}
              <div className={`relative flex justify-center items-center h-48 w-full rounded-lg border overflow-hidden transition-all duration-300 ${theme === "dark"
                  ? "bg-black/10 border-neutral-900/60"
                  : "bg-slate-50/50 border-slate-200"
                }`}>

                <svg className="w-full h-full" viewBox="0 0 600 200" xmlns="http://www.w3.org/2000/svg">
                  {/* Left Connection Line */}
                  <path d="M 300 45 L 120 135" stroke={isAuthFailed ? "#ef4444" : theme === "dark" ? "#1f1f2e" : "#cbd5e1"} strokeWidth="1.5" fill="none" className={isAuthFailed ? "" : "animate-dash"} />
                  {/* Middle Connection Line */}
                  <path d="M 300 45 L 300 135" stroke={isPaymentFailed ? "#ef4444" : theme === "dark" ? "#1f1f2e" : "#cbd5e1"} strokeWidth="1.5" fill="none" className={isPaymentFailed ? "" : "animate-dash"} />
                  {/* Right Connection Line */}
                  <path d="M 300 45 L 480 135" stroke={theme === "dark" ? "#1f1f2e" : "#cbd5e1"} strokeWidth="1.5" fill="none" className="animate-dash" />

                  {/* Central Node: VPC Gateway */}
                  <foreignObject x="252" y="10" width="96" height="85">
                    <div className="flex flex-col items-center justify-center w-full">
                      <div className={`relative h-10 w-10 rounded-lg border flex items-center justify-center shadow-lg transition-all duration-300 ${theme === "dark"
                          ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
                          : "bg-indigo-50 border-indigo-200 text-indigo-600"
                        }`}>
                        <Server className="h-5 w-5" />
                        <span className={`absolute -inset-1 rounded-lg border animate-radar-pulse pointer-events-none ${theme === "dark" ? "border-indigo-500/40" : "border-indigo-600/30"
                          }`} />
                      </div>
                      <span className={`font-mono text-[9px] mt-2 transition-colors duration-300 ${theme === "dark" ? "text-neutral-400" : "text-slate-550"
                        }`}>VPC-Gateway</span>
                    </div>
                  </foreignObject>

                  {/* Node 1: Auth Service */}
                  <foreignObject x="72" y="110" width="96" height="85">
                    <div className="flex flex-col items-center justify-center w-full">
                      <div className={`relative h-10 w-10 rounded-lg flex items-center justify-center shadow-lg transition-colors duration-300 border ${isAuthFailed
                          ? "bg-red-500/10 border-red-500/40 text-red-400"
                          : theme === "dark"
                            ? "bg-neutral-900 border-neutral-800 text-neutral-500"
                            : "bg-slate-100 border-slate-200 text-slate-400"
                        }`}>
                        <Cpu className="h-5 w-5" />
                        {isAuthFailed && (
                          <span className="absolute -inset-1 rounded-lg border border-red-500/40 animate-radar-pulse pointer-events-none" />
                        )}
                      </div>
                      <span className={`font-mono text-[9px] mt-2 transition-colors duration-300 ${theme === "dark" ? "text-neutral-400" : "text-slate-550"
                        }`}>auth-service</span>
                    </div>
                  </foreignObject>

                  {/* Node 2: Payment API */}
                  <foreignObject x="252" y="110" width="96" height="85">
                    <div className="flex flex-col items-center justify-center w-full">
                      <div className={`relative h-10 w-10 rounded-lg flex items-center justify-center shadow-lg transition-colors duration-300 border ${isPaymentFailed
                          ? "bg-red-500/10 border-red-500/40 text-red-400"
                          : theme === "dark"
                            ? "bg-neutral-900 border-neutral-800 text-neutral-500"
                            : "bg-slate-100 border-slate-200 text-slate-400"
                        }`}>
                        <Cpu className="h-5 w-5" />
                        {isPaymentFailed && (
                          <span className="absolute -inset-1 rounded-lg border border-red-500/40 animate-radar-pulse pointer-events-none" />
                        )}
                      </div>
                      <span className={`font-mono text-[9px] mt-2 transition-colors duration-300 ${theme === "dark" ? "text-neutral-400" : "text-slate-550"
                        }`}>payment-api</span>
                    </div>
                  </foreignObject>

                  {/* Node 3: Order API */}
                  <foreignObject x="432" y="110" width="96" height="85">
                    <div className="flex flex-col items-center justify-center w-full">
                      <div className={`relative h-10 w-10 rounded-lg border flex items-center justify-center text-neutral-500 shadow-lg transition-colors duration-300 ${theme === "dark"
                          ? "bg-neutral-900 border-neutral-800"
                          : "bg-slate-100 border-slate-200"
                        }`}>
                        <Cpu className="h-5 w-5" />
                      </div>
                      <span className={`font-mono text-[9px] mt-2 transition-colors duration-300 ${theme === "dark" ? "text-neutral-400" : "text-slate-550"
                        }`}>order-api</span>
                    </div>
                  </foreignObject>
                </svg>

              </div>

              {/* Dynamic Status Explanations */}
              {status !== "idle" && status !== "dragging" && (
                <div className={`mt-4 p-4 rounded-lg border text-left font-sans text-xs leading-relaxed transition-all duration-300 ${theme === "dark"
                    ? "bg-[#07070a]/50 border-neutral-900 text-neutral-400"
                    : "bg-slate-50 border-slate-200 text-slate-650"
                  }`}>
                  <div className="flex items-center gap-1.5 border-b pb-2 mb-2 border-dashed dark:border-neutral-850 light:border-slate-200">
                    <Shield className="h-3.5 w-3.5 text-indigo-500" />
                    <span className={`font-serif font-bold text-sm tracking-tight ${theme === "dark" ? "text-neutral-350" : "text-slate-800"}`}>Live Node Diagnostic Logs</span>
                  </div>
                  <div className="flex flex-col gap-2.5">
                    {/* auth-service */}
                    <div className="flex items-start gap-2">
                      <span className={`font-serif font-bold shrink-0 text-xs ${isAuthFailed ? "text-red-500" : "text-emerald-500"}`}>
                        ● {isAuthFailed ? "CRIT" : "OK"}
                      </span>
                      <span>
                        <strong className={`font-serif font-semibold ${theme === "dark" ? "text-neutral-200" : "text-slate-900"}`}>auth-service</strong>:{" "}
                        {isAuthFailed 
                          ? "Degraded due to SQL transaction deadlock locks on user credential parsing schema." 
                          : "Healthy. Processing user authentication tokens and SSO requests at stable baseline rates."}
                      </span>
                    </div>
                    {/* payment-api */}
                    <div className="flex items-start gap-2">
                      <span className={`font-serif font-bold shrink-0 text-xs ${isPaymentFailed ? "text-red-500" : "text-emerald-500"}`}>
                        ● {isPaymentFailed ? "CRIT" : "OK"}
                      </span>
                      <span>
                        <strong className={`font-serif font-semibold ${theme === "dark" ? "text-neutral-200" : "text-slate-900"}`}>payment-api</strong>:{" "}
                        {isPaymentFailed 
                          ? "Degraded. Latency spiked to 2500ms due to database connection pool exhaustion under traffic load." 
                          : "Healthy. Ingesting transaction ledgers and payment processing runs within standard deviation baseline limits."}
                      </span>
                    </div>
                    {/* order-api */}
                    <div className="flex items-start gap-2">
                      <span className="font-serif font-bold text-emerald-500 shrink-0 text-xs">● OK</span>
                      <span>
                        <strong className={`font-serif font-semibold ${theme === "dark" ? "text-neutral-200" : "text-slate-900"}`}>order-api</strong>: Healthy. Routing inventory check calls and checkout payloads at standard rates.
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </section>

        </div>

        {/* RIGHT COLUMN: TIMELINE VISUALIZER OR RESULT DASHBOARD */}
        <div className="w-full lg:w-2/5 flex flex-col gap-6">

          {/* 🟢 EXTRAORDINARY CREATIVITY: REAL-TIME SCROLLING METRICS GRAPH */}
          <section id="telemetry-section" className={`relative w-full rounded-xl border p-6 backdrop-blur-sm overflow-hidden flex flex-col gap-4 transition-all duration-300 ${theme === "dark"
              ? "border-neutral-900 bg-neutral-950/40"
              : "border-slate-200 bg-white shadow-sm"
            }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Activity className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
                <span className={`font-mono text-xs font-bold uppercase tracking-wide ${theme === "dark" ? "text-neutral-300" : "text-slate-800"
                  }`}>
                  Live Telemetry Stream
                </span>
              </div>
              <span className={`font-mono text-[9px] ${theme === "dark" ? "text-neutral-500" : "text-slate-400"}`}>
                SCROLLING LATENCY GRAPH
              </span>
            </div>

            {/* Custom Scrolling Waveform Component */}
            <TelemetryStream status={status} result={result} theme={theme} />
          </section>

          <AnimatePresence mode="wait">
            {/* INITIAL LANDING / IDLE SCREEN */}
            {status === "idle" && (
              <motion.div
                key="idle-card"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className={`w-full rounded-xl border p-8 text-center backdrop-blur-sm transition-all duration-300 ${theme === "dark"
                    ? "border-neutral-900 bg-[#07070a]/40"
                    : "border-slate-200 bg-white shadow-sm"
                  }`}
              >
                <div className={`inline-flex rounded-full p-4 border mb-4 animate-pulse ${theme === "dark"
                    ? "bg-indigo-500/5 border-indigo-500/10 text-indigo-400"
                    : "bg-indigo-50 border-indigo-100 text-indigo-650"
                  }`}>
                  <Sliders className="h-6 w-6" />
                </div>
                <h3 className={`text-md font-semibold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>SRE Sandbox Ready</h3>
                <p className={`mt-2 text-xs font-mono leading-relaxed ${theme === "dark" ? "text-neutral-500" : "text-slate-550"}`}>
                  Upload your own <code className={`text-[10px] font-bold px-1 py-0.5 rounded ${theme === "dark" ? "text-neutral-400 bg-neutral-900" : "text-slate-700 bg-slate-100"
                    }`}>.json</code> file on the left, or click any preset in the top navbar to instantly simulate pipeline diagnostic anomalies.
                </p>
              </motion.div>
            )}

            {/* PIPELINE PROGRESS EXECUTION VISUALIZER */}
            {status === "processing" && (
              <motion.div
                key="visualizer-card"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="w-full flex flex-col gap-6"
              >
                {/* 1. Steps Timeline Container */}
                <div className={`w-full border rounded-xl p-6 shadow-xl backdrop-blur-md transition-all duration-300 ${theme === "dark"
                    ? "bg-neutral-950/60 border-neutral-900"
                    : "bg-white border-slate-200"
                  }`}>
                  <div className={`flex items-center justify-between border-b pb-3 mb-6 ${theme === "dark" ? "border-neutral-900" : "border-slate-150"
                    }`}>
                    <span className={`font-mono text-xs font-semibold uppercase animate-pulse ${theme === "dark" ? "text-indigo-400" : "text-indigo-600"
                      }`}>
                      Processing Agent Pipeline
                    </span>
                    <span className={`font-mono text-[9px] ${theme === "dark" ? "text-neutral-500" : "text-slate-400"
                      }`}>
                      STEP {currentStep} / 5
                    </span>
                  </div>

                  <div className={`relative flex flex-col gap-5 pl-5 border-l ${theme === "dark" ? "border-neutral-900/60" : "border-slate-150"
                    }`}>
                    {PIPELINE_STEPS.map((step, idx) => {
                      const isCompleted = idx + 1 < currentStep;
                      const isActive = idx + 1 === currentStep;

                      return (
                        <div key={step.id} className="relative flex flex-col gap-0.5 text-left">
                          <div className={`absolute left-[-26px] top-1.5 h-2.5 w-2.5 rounded-full border transition-all duration-300 ${isCompleted
                              ? "bg-green-500 border-green-600"
                              : isActive
                                ? "bg-indigo-500 border-indigo-600 scale-125 animate-pulse"
                                : theme === "dark"
                                  ? "bg-neutral-950 border-neutral-800"
                                  : "bg-white border-slate-200"
                            }`} />

                          <p className={`text-xs font-mono font-bold transition-colors duration-300 ${isCompleted
                              ? "text-neutral-350"
                              : isActive
                                ? "text-indigo-500"
                                : theme === "dark"
                                  ? "text-neutral-600"
                                  : "text-slate-400"
                            }`}>
                            {step.label}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {/* 2. Retro Console Terminal log panel */}
                <div className={`w-full bg-black/80 rounded-xl p-5 shadow-inner border transition-all duration-300 ${theme === "dark" ? "border-neutral-900" : "border-slate-200"
                  }`}>
                  <div className={`flex items-center justify-between border-b pb-3 mb-3 ${theme === "dark" ? "border-neutral-900" : "border-slate-800"
                    }`}>
                    <div className="flex items-center gap-1.5">
                      <Terminal className="h-3.5 w-3.5 text-green-500" />
                      <span className={`font-mono text-[10px] uppercase font-bold ${theme === "dark" ? "text-neutral-400" : "text-slate-400"
                        }`}>
                        Diagnostics Console Logs
                      </span>
                    </div>
                  </div>
                  <div className="h-40 overflow-y-auto font-mono text-[10px] text-green-500/90 flex flex-col gap-1 text-left leading-relaxed">
                    {consoleLogs.map((log, lIdx) => (
                      <p key={lIdx}>{log}</p>
                    ))}
                    <div className="h-1 w-1 bg-green-500 animate-pulse mt-1" />
                  </div>
                </div>
              </motion.div>
            )}

            {/* RESULTS DASHBOARD */}
            {(status === "success" || status === "error") && result && (
              <motion.div
                key="result-card"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`w-full flex flex-col gap-6 transition-opacity duration-200 ${isResetting ? "opacity-0" : "opacity-100"}`}
              >
                {/* Result Card Error Banner */}
                {status === "error" ? (
                  <div className={`w-full rounded-xl border p-6 text-center backdrop-blur-md shadow-2xl transition-all duration-300 ${theme === "dark"
                      ? "border-red-500/20 bg-red-500/5"
                      : "border-red-200 bg-red-50/50"
                    }`}>
                    <div className="inline-flex rounded-full bg-red-500/10 p-3 border border-red-500/20 text-red-500 mb-3">
                      <AlertOctagon className="h-6 w-6" />
                    </div>
                    <h3 className={`text-md font-semibold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>SRE Loop Error</h3>
                    <p className={`mt-2 text-xs font-mono leading-relaxed ${theme === "dark" ? "text-red-400/90" : "text-red-650"
                      }`}>
                      {errorMessage}
                    </p>
                    <button
                      onClick={handleReset}
                      className={`mt-5 inline-flex items-center gap-2 rounded-lg border px-4 py-2 font-mono text-xs transition-colors cursor-pointer ${theme === "dark"
                          ? "border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-300"
                          : "border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-705"
                        }`}
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span>Audit New Logs</span>
                    </button>
                  </div>
                ) : (
                  /* Success Incident Grid Details */
                  <div className="w-full flex flex-col gap-6">

                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Card 1: Severity */}
                      <div className={`rounded-xl border p-4 font-mono text-left transition-colors duration-300 ${theme === "dark"
                          ? "border-neutral-900 bg-neutral-950/40"
                          : "border-slate-200 bg-white shadow-sm"
                        }`}>
                        <p className={`text-[10px] font-bold uppercase tracking-wider ${theme === "dark" ? "text-neutral-600" : "text-slate-400"
                          }`}>Severity Level</p>
                        <p className={`text-xl font-bold mt-1 ${result.severity === "CRITICAL"
                            ? theme === "dark" ? "text-red-400" : "text-red-600"
                            : theme === "dark" ? "text-amber-400" : "text-amber-600"
                          }`}>
                          {result.severity}
                        </p>
                      </div>

                      {/* Card 2: Details */}
                      <div className={`rounded-xl border p-4 font-mono text-left transition-colors duration-300 ${theme === "dark"
                          ? "border-neutral-900 bg-neutral-950/40"
                          : "border-slate-200 bg-white shadow-sm"
                        }`}>
                        <p className={`text-[10px] font-bold uppercase tracking-wider ${theme === "dark" ? "text-neutral-600" : "text-slate-400"
                          }`}>Total Incidents</p>
                        <p className={`text-xl font-bold mt-1 ${theme === "dark" ? "text-neutral-200" : "text-slate-800"
                          }`}>
                          {result.total_incidents} Flagged
                        </p>
                      </div>
                    </div>
                    {/* If System is Healthy */}
                    {result.total_incidents === 0 ? (
                      <div className={`w-full rounded-xl border p-8 text-center backdrop-blur-md transition-colors duration-300 ${theme === "dark"
                          ? "border-neutral-900 bg-neutral-950/40"
                          : "border-slate-200 bg-white shadow-sm"
                        }`}>
                        <div className="inline-flex rounded-full bg-emerald-500/10 p-3 border border-emerald-500/20 text-emerald-400 mb-3">
                          <CheckSquare className="h-6 w-6" />
                        </div>
                        <h3 className={`text-md font-semibold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>Baseline is Clean</h3>
                        <p className={`mt-2 text-xs font-mono leading-relaxed ${theme === "dark" ? "text-neutral-550" : "text-slate-500"}`}>
                          No SRE telemetry anomalies were found. System is completely healthy.
                        </p>
                      </div>
                    ) : (
                      /* Loop Incidents into dashboard details */
                      result.incidents.map((incident: any, idx: number) => {
                        const isLatency = "baseline_ms" in incident;
                        const isCritical = incident.severity === "CRITICAL";

                        return (
                          <motion.div
                            key={incident.group_id || idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`w-full rounded-xl border p-5 text-left font-mono transition-all duration-300 ${theme === "dark"
                                ? "border-neutral-900 bg-[#07070a]/60"
                                : "border-slate-200 bg-white shadow-sm"
                              }`}
                          >
                            <div className={`flex items-center justify-between border-b pb-3 mb-4 ${theme === "dark" ? "border-neutral-900" : "border-slate-100"
                              }`}>
                              <span className={`text-xs font-bold uppercase tracking-wide ${theme === "dark" ? "text-neutral-200" : "text-slate-800"
                                }`}>
                                Incident #{idx + 1}
                              </span>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded border transition-colors ${isCritical
                                  ? theme === "dark" ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-red-50 border-red-200 text-red-600"
                                  : theme === "dark" ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : "bg-amber-50 border-amber-200 text-amber-700"
                                }`}>
                                {incident.severity}
                              </span>
                            </div>

                            {/* Info Rows */}
                            <div className="flex flex-col gap-2.5 text-xs mb-4">
                              <div className="flex justify-between">
                                <span className={theme === "dark" ? "text-neutral-600" : "text-slate-400"}>Endpoint:</span>
                                <span className={`font-semibold ${theme === "dark" ? "text-neutral-200" : "text-slate-800"}`}>{incident.endpoint}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className={theme === "dark" ? "text-neutral-600" : "text-slate-400"}>Type:</span>
                                <span className={`text-[10px] ${theme === "dark" ? "text-neutral-200" : "text-slate-800"}`}>{formatFailureType(incident.failure_type)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className={theme === "dark" ? "text-neutral-600" : "text-slate-400"}>Count:</span>
                                <span className={`font-semibold ${theme === "dark" ? "text-neutral-200" : "text-slate-800"}`}>{incident.occurrences}x</span>
                              </div>
                              <div className="flex justify-between">
                                <span className={theme === "dark" ? "text-neutral-600" : "text-slate-400"}>Historical Baseline:</span>
                                <span className={theme === "dark" ? "text-neutral-200" : "text-slate-800"}>
                                  {isLatency ? `${incident.baseline_ms}ms` : `${incident.baseline_error_rate_pct}%`}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className={theme === "dark" ? "text-neutral-600" : "text-slate-400"}>Current Observation:</span>
                                <span className={
                                  isCritical
                                    ? theme === "dark" ? "text-red-400 font-bold" : "text-red-600 font-bold"
                                    : theme === "dark" ? "text-amber-400 font-bold" : "text-amber-600 font-bold"
                                }>
                                  {isLatency ? `${incident.peak_ms}ms` : `${incident.peak_error_rate_pct}%`}
                                </span>
                              </div>
                            </div>

                            {/* Likely Causes */}
                            <div className="flex flex-col gap-2 mb-4">
                              <span className={`text-[10px] font-bold uppercase tracking-wider ${theme === "dark" ? "text-neutral-500" : "text-slate-400"
                                }`}>Likely Causes</span>
                              <div className={`rounded-lg border p-3 flex flex-col gap-2 text-[11px] leading-relaxed transition-colors duration-300 ${theme === "dark"
                                  ? "border-neutral-900 bg-neutral-950/80 text-neutral-400"
                                  : "border-slate-200 bg-slate-50 text-slate-700"
                                }`}>
                                {incident.likely_causes.map((cause: string, cIdx: number) => (
                                  <div key={cIdx} className="flex gap-2">
                                    <span className={theme === "dark" ? "text-neutral-600 font-bold shrink-0" : "text-slate-400 font-bold shrink-0"}>{cIdx + 1}.</span>
                                    <p>{cause}</p>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Actions Checklist */}
                            <div className="flex flex-col gap-2">
                              <span className={`text-[10px] font-bold uppercase tracking-wider ${theme === "dark" ? "text-neutral-500" : "text-slate-400"
                                }`}>Investigation Steps</span>
                              <div className="flex flex-col gap-2">
                                {incident.recommended_actions.map((action: string, aIdx: number) => {
                                  const actionGlobalIndex = idx * 10 + aIdx;
                                  const isChecked = checkedActions[actionGlobalIndex];
                                  const isCopied = copiedActionIdx === actionGlobalIndex;

                                  return (
                                    <div
                                      key={aIdx}
                                      className={`flex items-start justify-between gap-3 p-2.5 rounded border transition-colors leading-relaxed text-[11px] ${theme === "dark"
                                          ? isChecked
                                            ? "border-neutral-900 bg-neutral-950/20 text-neutral-600"
                                            : "border-neutral-900 bg-neutral-950/60 text-neutral-350 hover:border-neutral-800"
                                          : isChecked
                                            ? "border-slate-200 bg-slate-50 text-slate-400"
                                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                                        }`}
                                    >
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() => toggleCheckAction(actionGlobalIndex)}
                                          className="mt-0.5 shrink-0 rounded border border-neutral-800 bg-neutral-900 flex items-center justify-center h-3.5 w-3.5"
                                        >
                                          {isChecked && <Check className="h-2.5 w-2.5 text-indigo-400" />}
                                        </button>
                                        <p className={isChecked ? "line-through text-neutral-600" : ""}>{action}</p>
                                      </div>

                                      <button
                                        onClick={() => handleCopyAction(action, actionGlobalIndex)}
                                        className="shrink-0 p-0.5 rounded text-neutral-600 hover:text-white"
                                      >
                                        {isCopied ? (
                                          <Check className="h-3 w-3 text-green-500" />
                                        ) : (
                                          <Copy className="h-3 w-3" />
                                        )}
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                          </motion.div>
                        );
                      })
                    )}

                    {/* Export and reset toolbar */}
                    <div className={`flex flex-col sm:flex-row gap-3 mt-4 border-t pt-6 ${theme === "dark" ? "border-neutral-900" : "border-slate-150"
                      }`}>
                      <button
                        onClick={handleReset}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-transparent text-xs font-mono border border-neutral-350 dark:border-neutral-800 hover:border-red-400 hover:text-red-450 dark:hover:text-red-400 hover:shadow-[0_0_8px_rgba(248,113,113,0.3)] transition-all duration-200 cursor-pointer py-3 text-neutral-500"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span>Run Another Test</span>
                      </button>
                      <button
                        onClick={() => setIsModalOpen(true)}
                        className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg border py-3 text-xs font-mono transition-colors cursor-pointer ${theme === "dark"
                            ? "border-neutral-800 bg-neutral-950 hover:bg-neutral-900 text-neutral-400"
                            : "border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700"
                          }`}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>View Raw JSON</span>
                      </button>
                      <button
                        onClick={downloadReport}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white py-3 text-xs font-mono font-medium transition-all shadow-[0_0_15px_rgba(79,70,229,0.15)] cursor-pointer border-0"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Download alert.json</span>
                      </button>
                    </div>

                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

        </div>

      </main>

      {/* 📖 FULL-FLEDGED INLINE ABOUT & GUIDE SECTION */}
      <motion.section
        id="about-section"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`relative z-10 border-t transition-all duration-300 py-20 overflow-hidden ${theme === "dark"
            ? "border-neutral-900/60 bg-[#050507]"
            : "border-slate-200 bg-white"
          }`}
      >
        {/* Dynamic Motion Shader Background for Guide Section */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <ChromaFlow 
            baseColor={theme === "dark" ? "#050507" : "#ffffff"}
            leftColor={theme === "dark" ? "rgba(99, 102, 241, 0.06)" : "rgba(99, 102, 241, 0.04)"}
            rightColor={theme === "dark" ? "rgba(239, 68, 68, 0.04)" : "rgba(239, 68, 68, 0.03)"}
            upColor={theme === "dark" ? "rgba(16, 185, 129, 0.04)" : "rgba(16, 185, 129, 0.03)"}
            downColor={theme === "dark" ? "rgba(245, 158, 11, 0.04)" : "rgba(245, 158, 11, 0.03)"}
            momentum={5}
            radius={4}
          />
          <FilmGrain strength={theme === "dark" ? 0.02 : 0.015} />
          
          {/* Subtle Grid overlay localized to this section */}
          <div 
            className="absolute inset-0 opacity-40 animate-grid-move"
            style={{
              backgroundImage: theme === "dark"
                ? `linear-gradient(to right, rgba(99, 102, 241, 0.08) 1px, transparent 1px),
                   linear-gradient(to bottom, rgba(99, 102, 241, 0.08) 1px, transparent 1px)`
                : `linear-gradient(to right, rgba(99, 102, 241, 0.12) 1px, transparent 1px),
                   linear-gradient(to bottom, rgba(99, 102, 241, 0.12) 1px, transparent 1px)`,
              backgroundSize: "48px 48px",
            }}
          />
        </div>

        <div className="relative z-20 mx-auto max-w-5xl px-6">

          {/* Section Title */}
          <div className="text-center mb-16">
            <div className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-mono tracking-wide mb-4 ${theme === "dark"
                ? "border-indigo-500/15 bg-indigo-500/5 text-indigo-400"
                : "border-indigo-200 bg-indigo-50 text-indigo-700"
              }`}>
              <BookOpen className="h-3.5 w-3.5" />
              <span>THE RISE & NEED OF AGENT SHASTRA</span>
            </div>

            <h2 className={`text-3xl font-extrabold tracking-tight sm:text-4xl transition-all duration-300 ${theme === "dark" ? "text-white" : "text-slate-900"
              }`}
              style={{ fontFamily: 'var(--font-accent)' }}
            >
              Why <span className="font-display italic font-medium text-indigo-500 dark:text-indigo-400">Agent Shastra</span>?
            </h2>
            <p className={`mt-3 text-[10px] font-mono tracking-widest uppercase ${theme === "dark" ? "text-neutral-500" : "text-slate-450"
              }`}>
              RESOLVING MODERN ALERT FATIGUE WITH RELATIVE STATISTICAL INTELLIGENCE
            </p>
          </div>

          {/* Grid Layout for Challenge and Advantages */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">

            {/* Left: Challenge We Solve */}
            <div className="flex flex-col gap-4 text-left font-mono">
              <div className={`inline-flex items-center gap-1.5 self-start rounded-full border px-2.5 py-0.5 text-[9px] font-bold ${theme === "dark"
                  ? "border-red-500/20 bg-red-500/5 text-red-400"
                  : "border-red-200 bg-red-50 text-red-650"
                }`}>
                <Shield className="h-3 w-3 animate-pulse" />
                <span>THE PRODUCTION INCIDENT CRISIS (THE PROBLEM)</span>
              </div>
              <h3 className={`text-lg font-bold ${theme === "dark" ? "text-neutral-200" : "text-slate-800"}`}
                style={{ fontFamily: 'var(--font-accent)' }}
              >
                Alert Fatigue & Cascading Failures
              </h3>
              <p className={`text-xs leading-relaxed font-sans ${theme === "dark" ? "text-neutral-400" : "text-slate-650"}`}>
                In modern microservices under heavy load, failures cascade. A database limit bottleneck propagates downstream to gateways, triggering a massive storm of parallel alerts. SREs receive hundreds of alarms simultaneously.
              </p>
              <p className={`text-xs leading-relaxed font-sans ${theme === "dark" ? "text-neutral-400" : "text-slate-650"}`}>
                Engineers waste precious hours sorting through noisy duplicate alarms, attempting to correlate timestamps manually. The result is high MTTR (Mean Time to Resolution), business revenue leakage, and severe developer burnout.
              </p>
            </div>

            {/* Right: How Agent Shastra Solves It */}
            <div className="flex flex-col gap-4 text-left font-mono">
              <div className={`inline-flex items-center gap-1.5 self-start rounded-full border px-2.5 py-0.5 text-[9px] font-bold ${theme === "dark"
                  ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
                }`}>
                <Award className="h-3 w-3" />
                <span>INTELLIGENT SRE AUTOMATION (THE SOLUTION)</span>
              </div>
              <h3 className={`text-lg font-bold ${theme === "dark" ? "text-neutral-200" : "text-slate-800"}`}
                style={{ fontFamily: 'var(--font-accent)' }}
              >
                Dynamic Noise Filtering & Correlation
              </h3>
              <div className="flex flex-col gap-4 mt-2">
                <div className="flex gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-xs leading-relaxed font-sans"><strong className={theme === "dark" ? "text-neutral-300" : "text-slate-700"}>Automated Noise Cleanup:</strong> Employs strict validation and isolated standard deviation checking so raw telemetry never pollutes baseline averages.</p>
                </div>
                <div className="flex gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-xs leading-relaxed font-sans"><strong className={theme === "dark" ? "text-neutral-300" : "text-slate-700"}>Chronological Correlation:</strong> Grouping multi-service failures occurring within 120s of each other into a single actionable incident.</p>
                </div>
                <div className="flex gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-xs leading-relaxed font-sans"><strong className={theme === "dark" ? "text-neutral-300" : "text-slate-700"}>Root Cause Reasoning (Gemini):</strong> Invokes custom prompt-engineered LLMs to isolate symptoms, diagnose root causes, and generate click-to-copy playbooks instantly.</p>
                </div>
              </div>
            </div>

          </div>

          {/* Section: Architecture Features */}
          <div className="mb-20">
            <h3 className={`text-lg font-bold font-mono text-left mb-6 border-b pb-2 ${theme === "dark" ? "border-neutral-900 text-neutral-300" : "border-slate-100 text-slate-800"
              }`}>
              Engine <span className="font-display italic font-medium text-indigo-500 dark:text-indigo-400">Architecture</span> Components
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

              <div className={`p-5 rounded-xl border text-left font-mono flex flex-col gap-2 transition-all duration-300 ${theme === "dark"
                  ? "bg-neutral-950/40 border-neutral-900 hover:border-neutral-800"
                  : "bg-slate-50 border-slate-200 hover:bg-slate-100/50 shadow-sm"
                }`}>
                <div className="text-xs font-bold text-indigo-500 dark:text-indigo-400 font-mono">01 · AUDIT</div>
                <h4 className={`text-xs font-bold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>Resilient Log Parsing</h4>
                <p className={`text-[11px] leading-relaxed font-sans ${theme === "dark" ? "text-neutral-500" : "text-slate-550"}`}>
                  Strict ISO-8601 validation filters raw logs. Gracefully discards corrupt entries while mapping valid fields into clean memory arrays.
                </p>
              </div>

              <div className={`p-5 rounded-xl border text-left font-mono flex flex-col gap-2 transition-all duration-300 ${theme === "dark"
                  ? "bg-neutral-950/40 border-neutral-900 hover:border-neutral-800"
                  : "bg-slate-50 border-slate-200 hover:bg-slate-100/50 shadow-sm"
                }`}>
                <div className="text-xs font-bold text-indigo-500 dark:text-indigo-400 font-mono">02 · DETECT</div>
                <h4 className={`text-xs font-bold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>Variance-Protected Baselines</h4>
                <p className={`text-[11px] leading-relaxed font-sans ${theme === "dark" ? "text-neutral-500" : "text-slate-550"}`}>
                  Computes rolling averages and standard deviations. Safely guards zero-variance baselines with relative increase factors.
                </p>
              </div>

              <div className={`p-5 rounded-xl border text-left font-mono flex flex-col gap-2 transition-all duration-300 ${theme === "dark"
                  ? "bg-neutral-950/40 border-neutral-900 hover:border-neutral-800"
                  : "bg-slate-50 border-slate-200 hover:bg-slate-100/50 shadow-sm"
                }`}>
                <div className="text-xs font-bold text-indigo-500 dark:text-indigo-400 font-mono">03 · CLUSTER</div>
                <h4 className={`text-xs font-bold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>Chronological Correlator</h4>
                <p className={`text-[11px] leading-relaxed font-sans ${theme === "dark" ? "text-neutral-500" : "text-slate-550"}`}>
                  Applies sliding-window clusters (120s frames) to aggregate parallel anomalies across different services, identifying upstream triggers.
                </p>
              </div>

              <div className={`p-5 rounded-xl border text-left font-mono flex flex-col gap-2 transition-all duration-300 ${theme === "dark"
                  ? "bg-neutral-950/40 border-neutral-900 hover:border-neutral-800"
                  : "bg-slate-50 border-slate-200 hover:bg-slate-100/50 shadow-sm"
                }`}>
                <div className="text-xs font-bold text-indigo-500 dark:text-indigo-400 font-mono">04 · SOLVE</div>
                <h4 className={`text-xs font-bold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>Multi-Model Debugging</h4>
                <p className={`text-[11px] leading-relaxed font-sans ${theme === "dark" ? "text-neutral-500" : "text-slate-550"}`}>
                  Invokes Gemini or Claude for SRE insight. Automatically falls back to localized, context-rich dependency diagnostics if offline.
                </p>
              </div>

            </div>
          </div>

          {/* Section: Operational Timeline Guide */}
          <div className="mb-20">
            <h3 className={`text-lg font-bold font-mono text-left mb-6 border-b pb-2 ${theme === "dark" ? "border-neutral-900 text-neutral-300" : "border-slate-100 text-slate-800"
              }`}>
              Operator's <span className="font-display italic font-medium text-indigo-500 dark:text-indigo-400">Playbook</span> Workflow
            </h3>
            <div className={`p-6 rounded-xl border text-left font-mono flex flex-col gap-5 transition-all duration-300 ${theme === "dark" ? "border-neutral-900 bg-neutral-950/20" : "border-slate-150 bg-slate-50/50"
              }`}>
              <div className="flex items-start gap-4">
                <span className="font-bold text-indigo-500 dark:text-indigo-400 text-xs shrink-0 mt-0.5">STEP 01</span>
                <div>
                  <h4 className={`text-xs font-bold ${theme === "dark" ? "text-neutral-200" : "text-slate-800"}`}>Load Incident Context</h4>
                  <p className={`text-[11px] mt-1 leading-relaxed font-sans ${theme === "dark" ? "text-neutral-500" : "text-slate-550"}`}>
                    Drop a standard JSON logs payload into the active interface, or select one of the sandbox preset configs directly inside the header navbar (Normal, Latency Spike, or Error Rate Spike).
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="font-bold text-indigo-500 dark:text-indigo-400 text-xs shrink-0 mt-0.5">STEP 02</span>
                <div>
                  <h4 className={`text-xs font-bold ${theme === "dark" ? "text-neutral-200" : "text-slate-800"}`}>Boot SRE Telemetry Kernel</h4>
                  <p className={`text-[11px] mt-1 leading-relaxed font-sans ${theme === "dark" ? "text-neutral-500" : "text-slate-550"}`}>
                    Hit "Run SRE Diagnostic Loop". The system instantly activates the console logger, kicks off live telemetry graphs, and traces dependencies across node gateway states.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="font-bold text-indigo-500 dark:text-indigo-400 text-xs shrink-0 mt-0.5">STEP 03</span>
                <div>
                  <h4 className={`text-xs font-bold ${theme === "dark" ? "text-neutral-200" : "text-slate-800"}`}>Analyze Consolidated Findings</h4>
                  <p className={`text-[11px] mt-1 leading-relaxed font-sans ${theme === "dark" ? "text-neutral-500" : "text-slate-550"}`}>
                    Review the incident cards generated on the right. Check co-occurring failures, computed baseline comparisons, peak spikes, and detailed root-cause summaries.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="font-bold text-indigo-500 dark:text-indigo-400 text-xs shrink-0 mt-0.5">STEP 04</span>
                <div>
                  <h4 className={`text-xs font-bold ${theme === "dark" ? "text-neutral-200" : "text-slate-800"}`}>Complete Actionable playbooks</h4>
                  <p className={`text-[11px] mt-1 leading-relaxed font-sans ${theme === "dark" ? "text-neutral-500" : "text-slate-550"}`}>
                    Follow step-by-step investigation action lines. Check off completed checks directly in the UI, and copy specific terminal troubleshooting lines with a single click.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Frequently Asked Questions */}
          <div className={`p-8 rounded-2xl border transition-all duration-300 ${theme === "dark"
              ? "border-neutral-900 bg-neutral-950/20"
              : "border-slate-200 bg-slate-50/50 shadow-sm"
            }`}>
            <h3 className={`text-lg font-bold font-mono text-left mb-6 border-b pb-2 ${theme === "dark" ? "border-neutral-900 text-neutral-300" : "border-slate-100 text-slate-800"
              }`}>
              Frequently Asked <span className="font-display italic font-medium text-indigo-500 dark:text-indigo-400">Questions</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left font-mono">
              <div className="flex flex-col gap-1.5">
                <h5 className={`text-xs font-bold ${theme === "dark" ? "text-neutral-200" : "text-slate-800"}`}>Q: How is standard deviation baseline leakage avoided?</h5>
                <p className={`text-[11px] leading-relaxed font-sans ${theme === "dark" ? "text-neutral-500" : "text-slate-550"}`}>
                  A: Spikes are identified by evaluating logs in isolated intervals. Spikes are immediately segmented and never added back to baseline calculation pools, ensuring thresholds remain highly clean.
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <h5 className={`text-xs font-bold ${theme === "dark" ? "text-neutral-200" : "text-slate-800"}`}>Q: How are downstream dependencies correlated?</h5>
                <p className={`text-[11px] leading-relaxed font-sans ${theme === "dark" ? "text-neutral-500" : "text-slate-550"}`}>
                  A: The sliding-window grouper checks timestamp proximity. When a payment-api spike happens within 120s of an auth failure, the kernel aggregates them, highlighting co-dependency.
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <h5 className={`text-xs font-bold ${theme === "dark" ? "text-neutral-200" : "text-slate-800"}`}>Q: Does this require an active network gateway connection?</h5>
                <p className={`text-[11px] leading-relaxed font-sans ${theme === "dark" ? "text-neutral-500" : "text-slate-550"}`}>
                  A: No. The offline fallback diagnostics engine operates completely on locally mapped dependency rules, executing with peak efficiency without requiring public key configs.
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <h5 className={`text-xs font-bold ${theme === "dark" ? "text-neutral-200" : "text-slate-800"}`}>Q: Can I load high-frequency production payloads?</h5>
                <p className={`text-[11px] leading-relaxed font-sans ${theme === "dark" ? "text-neutral-500" : "text-slate-550"}`}>
                  A: Absolutely. The backend parsers and sliding-window grouping engines are implemented in highly-efficient O(N log N) formats, capable of evaluating thousands of rows under milliseconds.
                </p>
              </div>
            </div>
          </div>

        </div>
      </motion.section>



      {/* RAW JSON PREVIEW MODAL */}
      {result && (
        <ResultModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          rawJson={JSON.stringify(result, null, 2)}
        />
      )}

      {/* ABOUT DOCUMENTATION GUIDE MODAL */}
      <AnimatePresence>
        {isAboutOpen && (
          <AboutModal
            isOpen={isAboutOpen}
            onClose={() => setIsAboutOpen(false)}
            theme={theme}
          />
        )}
      </AnimatePresence>

      {/* SYNTHWAVE FOOTER */}
      <Footer />

    </div>
    </>
  );
}
