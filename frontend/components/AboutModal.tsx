"use client";

import { X, BookOpen, Compass, CheckCircle2, HelpCircle, Shield, Award } from "lucide-react";
import { motion } from "framer-motion";

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: "dark" | "light";
}

export default function AboutModal({ isOpen, onClose, theme }: AboutModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Modal Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className={`relative w-full max-w-3xl max-h-[85vh] rounded-xl border p-6 md:p-8 flex flex-col overflow-hidden transition-all duration-300 shadow-2xl ${
          theme === "dark"
            ? "border-neutral-900 bg-[#07070a] text-neutral-200"
            : "border-slate-200 bg-white text-slate-800"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4 mb-6 border-neutral-900 dark:border-neutral-900 light:border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className={`rounded-lg p-2 border ${
              theme === "dark" 
                ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400" 
                : "bg-indigo-50 border-indigo-100 text-indigo-600"
            }`}>
              <BookOpen className="h-5 w-5" />
            </div>
            <div className="text-left">
              <h2 className={`text-lg font-bold tracking-tight leading-none ${
                theme === "dark" ? "text-white" : "text-slate-900"
              }`}
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                Agent Guide & Documentation
              </h2>
              <span className={`text-[9px] tracking-wider uppercase ${
                theme === "dark" ? "text-neutral-500" : "text-slate-400"
              }`}
                style={{ fontFamily: 'var(--font-accent)' }}
              >
                Agent Shastra · SRE Kernel Overview
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`rounded-md p-1.5 border transition-all cursor-pointer ${
              theme === "dark"
                ? "border-neutral-800 bg-neutral-900 hover:bg-neutral-850 text-neutral-400 hover:text-white"
                : "border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800"
            }`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-8 text-left text-xs leading-relaxed font-mono">
          
          {/* 🔍 ENTERPRISE CHALLENGE & INTRO */}
          <section className="flex flex-col gap-3">
            <div className={`inline-flex items-center gap-1.5 self-start rounded-full border px-2.5 py-0.5 text-[9px] font-semibold ${
              theme === "dark"
                ? "border-red-500/20 bg-red-500/5 text-red-400"
                : "border-red-200 bg-red-50 text-red-650"
            }`}
              style={{ fontFamily: 'var(--font-accent)' }}
            >
              <Shield className="h-3 w-3 animate-pulse" />
              <span>The Challenge We Solve</span>
            </div>
            <p className={`text-sm leading-relaxed ${ theme === "dark" ? "text-neutral-300" : "text-slate-700"}`}
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              Modern cloud architectures process millions of API calls per second. When incident storms hit, developers are inundated with unconsolidated alert fatigue while microservices degrade co-dependently. 
            </p>
            <p className={`text-sm leading-relaxed ${ theme === "dark" ? "text-neutral-400" : "text-slate-650"}`}
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              <strong>Agent Shastra</strong> directly addresses the enterprise-scale operational challenge of alert fatigue: replacing static rule checks with a complete <strong>ingest-to-diagnostic loop</strong>. By computing dynamic statistical boundaries, clustering co-occurring spikes chronologically, and applying symptom-based AI fallback logic, it identifies shared bottlenecks and constructs actionable investigation checklists in seconds—reducing MTTR to near zero.
            </p>
          </section>

          {/* 🚀 WHAT IT DOES & KEY FEATURES */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-1.5">
              <Compass className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
              <span className={`text-xs font-semibold uppercase tracking-widest ${
                theme === "dark" ? "text-neutral-300" : "text-slate-800"
              }`}
                style={{ fontFamily: 'var(--font-serif)' }}
              >Features & Architecture</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`p-4 rounded-lg border ${
                theme === "dark" ? "bg-neutral-950/40 border-neutral-900" : "bg-slate-50 border-slate-200"
              }`}>
                <h4 className={`text-sm font-semibold mb-1.5 ${ theme === "dark" ? "text-neutral-200" : "text-slate-800"}`}
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  1. Dynamic Telemetry Audit
                </h4>
                <p className={`text-xs leading-relaxed ${ theme === "dark" ? "text-neutral-500" : "text-slate-500"}`}
                  style={{ fontFamily: 'var(--font-sans)' }}
                >
                  Calculates running baseline averages and standard deviations. It isolates spikes from baselines, ensuring anomalies are detected with clean boundaries.
                </p>
              </div>
              <div className={`p-4 rounded-lg border ${
                theme === "dark" ? "bg-neutral-950/40 border-neutral-900" : "bg-slate-50 border-slate-200"
              }`}>
                <h4 className={`text-sm font-semibold mb-1.5 ${ theme === "dark" ? "text-neutral-200" : "text-slate-800"}`}
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  2. Sliding-Window Correlator
                </h4>
                <p className={`text-xs leading-relaxed ${ theme === "dark" ? "text-neutral-500" : "text-slate-500"}`}
                  style={{ fontFamily: 'var(--font-sans)' }}
                >
                  Correlates distinct API failures across gateways within brief 120s sliding frames, automatically clustering simultaneous issues together.
                </p>
              </div>
              <div className={`p-4 rounded-lg border ${
                theme === "dark" ? "bg-neutral-950/40 border-neutral-900" : "bg-slate-50 border-slate-200"
              }`}>
                <h4 className={`text-sm font-semibold mb-1.5 ${ theme === "dark" ? "text-neutral-200" : "text-slate-800"}`}
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  3. Multi-Model AI Fallbacks
                </h4>
                <p className={`text-xs leading-relaxed ${ theme === "dark" ? "text-neutral-500" : "text-slate-500"}`}
                  style={{ fontFamily: 'var(--font-sans)' }}
                >
                  Orchestrates enrichments via Gemini and Claude. If offline, the fallback diagnostics engine instantly generates safe dependency descriptors.
                </p>
              </div>
              <div className={`p-4 rounded-lg border ${
                theme === "dark" ? "bg-neutral-950/40 border-neutral-900" : "bg-slate-50 border-slate-200"
              }`}>
                <h4 className={`text-sm font-semibold mb-1.5 ${ theme === "dark" ? "text-neutral-200" : "text-slate-800"}`}
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  4. Interactive Checklist Rollup
                </h4>
                <p className={`text-xs leading-relaxed ${ theme === "dark" ? "text-neutral-500" : "text-slate-500"}`}
                  style={{ fontFamily: 'var(--font-sans)' }}
                >
                  Consolidates likely causes and outputs actionable checklist lines. Engineers can toggle tasks and copy steps with single-click actions.
                </p>
              </div>
            </div>
          </section>

          {/* 💎 REAL-WORLD ADVANTAGES */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-1.5">
              <Award className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
              <span className={`text-xs font-semibold uppercase tracking-widest ${
                theme === "dark" ? "text-neutral-300" : "text-slate-800"
              }`}
                style={{ fontFamily: 'var(--font-serif)' }}
              >Engineer & Production Value</span>
            </div>
            <div className="flex flex-col gap-2.5">
              <div className="flex gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <p><strong className={theme === "dark" ? "text-neutral-300" : "text-slate-700"}>Drastic MTTR Reduction:</strong> Pinpoints co-dependent system failures in seconds, shifting developers from passive logs lookup to immediate root cause resolution.</p>
              </div>
              <div className="flex gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <p><strong className={theme === "dark" ? "text-neutral-300" : "text-slate-700"}>Prevents Incident Storm Alert Fatigue:</strong> Aggregates millions of noisy telemetry rows into single correlated groups so engineers review one story, not hundreds of separate alerts.</p>
              </div>
              <div className="flex gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <p><strong className={theme === "dark" ? "text-neutral-300" : "text-slate-700"}>Air-Gapped Telemetry Security:</strong> Designed to run offline locally. Corporate network trace structures never leak to public APIs, keeping company metrics highly secure.</p>
              </div>
            </div>
          </section>

          {/* 📖 STEP-BY-STEP OPERATION GUIDE */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-1.5">
              <Compass className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
              <span className={`text-xs font-semibold uppercase tracking-widest ${
                theme === "dark" ? "text-neutral-300" : "text-slate-800"
              }`}
                style={{ fontFamily: 'var(--font-serif)' }}
              >Operation Guide</span>
            </div>
            <div className={`p-4 rounded-lg border flex flex-col gap-3 ${
              theme === "dark" ? "border-neutral-900 bg-neutral-950/20" : "border-slate-150 bg-slate-50/50"
            }`}>
              <div className="flex gap-2">
                <span className="font-bold text-indigo-550 shrink-0">STEP 1:</span>
                <p>Select an SRE Sandbox Preset in the top navbar (Normal, Latency Spike, Error Spike) or upload a custom JSON logs file in the Drag-and-Drop area.</p>
              </div>
              <div className="flex gap-2">
                <span className="font-bold text-indigo-550 shrink-0">STEP 2:</span>
                <p>Click "Run SRE Diagnostic Loop". This boots the real-time visualizer, starting the console telemetry stream and mapping network nodes.</p>
              </div>
              <div className="flex gap-2">
                <span className="font-bold text-indigo-550 shrink-0">STEP 3:</span>
                <p>Review the unified incidents report dashboard containing correlated gateways, calculated standard-deviation metrics, and AI diagnoses.</p>
              </div>
              <div className="flex gap-2">
                <span className="font-bold text-indigo-550 shrink-0">STEP 4:</span>
                <p>Audit and execute recommended actions. You can copy debugging commands and check off completed investigations in real-time.</p>
              </div>
            </div>
          </section>

          {/* ❓ FAQs */}
          <section className="flex flex-col gap-4 pb-4">
            <div className="flex items-center gap-1.5">
              <HelpCircle className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
              <span className={`text-xs font-semibold uppercase tracking-widest ${
                theme === "dark" ? "text-neutral-300" : "text-slate-800"
              }`}
                style={{ fontFamily: 'var(--font-serif)' }}
              >Frequently Asked Questions</span>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1 text-left">
                <h5 className={`font-bold ${theme === "dark" ? "text-neutral-200" : "text-slate-800"}`}>Q: How is standard deviation baseline leakage avoided?</h5>
                <p className={theme === "dark" ? "text-neutral-500" : "text-slate-500"}>
                  A: The baseline calculations isolate the currently audited log window. Spikes are never allowed to bleed back into baseline stats, preventing alert dilution.
                </p>
              </div>
              <div className="flex flex-col gap-1 text-left">
                <h5 className={`font-bold ${theme === "dark" ? "text-neutral-200" : "text-slate-800"}`}>Q: Are custom SRE local names securely mapped?</h5>
                <p className={theme === "dark" ? "text-neutral-500" : "text-slate-500"}>
                  A: Yes. Local descriptions map diagnostics safely to general descriptors: shared dependency degradation, network bottlenecks, or backend contention, avoiding server trace leaks.
                </p>
              </div>
              <div className="flex flex-col gap-1 text-left">
                <h5 className={`font-bold ${theme === "dark" ? "text-neutral-200" : "text-slate-800"}`}>Q: Can I run this completely offline?</h5>
                <p className={theme === "dark" ? "text-neutral-500" : "text-slate-500"}>
                  A: Yes. The offline mode operates entirely on pre-configured local structures, running without standard Gemini/Claude api tokens.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-6 border-t pt-4 text-center border-neutral-900 dark:border-neutral-900 light:border-slate-100 flex justify-between items-center">
          <span className={`text-[9px] ${theme === "dark" ? "text-neutral-600" : "text-slate-400"}`}>
            ANTIGRAVITY MONITORING AGENT v1.0.3
          </span>
          <button
            onClick={onClose}
            className="rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-semibold px-4 py-2 cursor-pointer border-0 transition-colors shadow-md tracking-widest uppercase"
            style={{ fontFamily: 'var(--font-accent)' }}
          >
            Acknowledge & Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}
