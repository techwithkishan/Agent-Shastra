"use client";

import { memo } from "react";
import { motion } from "framer-motion";

// --- MEMOIZED HIGH-PERFORMANCE WAVE LAYER ---
const WaveLayer = memo(({ 
  className, 
  d, 
  speed, 
  opacity, 
  color 
}: { 
  className?: string;
  d: string; 
  speed: string; 
  opacity: number; 
  color: string;
}) => {
  return (
    <svg 
      className={`absolute bottom-0 left-0 w-[200%] h-36 pointer-events-none select-none will-change-transform ${className || ""}`}
      viewBox="0 0 2400 120" 
      preserveAspectRatio="none"
      style={{
        animation: `wave-flow ${speed} linear infinite`,
        opacity,
        color
      }}
    >
      <path d={d} fill="currentColor" />
    </svg>
  );
});

WaveLayer.displayName = "WaveLayer";

export default function Footer() {
  const handleScrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  return (
    <motion.footer 
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative z-10 w-full h-[240px] overflow-hidden flex flex-col items-center justify-center border-t border-indigo-500/10 dark:border-indigo-500/5 transition-all duration-300 bg-gradient-to-b from-[#0F172A] to-[#061321] select-none"
    >
      {/* CSS Keyframes for High Performance 60FPS Wave Motion */}
      <style>{`
        @keyframes wave-flow {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-wave-slow,
          .animate-wave-mid,
          .animate-wave-fast {
            animation: none !important;
            transform: none !important;
          }
        }
      `}</style>

      {/* WAVE LAYERS CONTAINER */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        
        {/* Wave 1: Slow / Deep Blue */}
        <WaveLayer 
          className="animate-wave-slow md:block"
          d="M0,60 C150,90 350,30 600,60 C850,90 1050,30 1200,60 C1350,90 1550,30 1800,60 C2050,90 2250,30 2400,60 L2400,120 L0,120 Z"
          speed="18s"
          opacity={0.16}
          color="#2563EB"
        />

        {/* Wave 2: Mid / Cyan */}
        <WaveLayer 
          className="animate-wave-mid"
          d="M0,80 C200,40 400,100 600,80 C800,40 1000,100 1200,80 C1400,40 1600,100 1800,80 C2000,40 2200,100 2400,80 L2400,120 L0,120 Z"
          speed="12s"
          opacity={0.11}
          color="#38BDF8"
        />

        {/* Wave 3: Fast / Dark Blue (Hidden on mobile for pure efficiency) */}
        <WaveLayer 
          className="animate-wave-fast hidden sm:block"
          d="M0,40 C100,70 300,10 600,40 C900,70 1100,10 1200,40 C1300,70 1500,10 1800,40 C2100,70 2300,10 2400,40 L2400,120 L0,120 Z"
          speed="8s"
          opacity={0.08}
          color="#1D4ED8"
        />

        {/* Glass reflection cover for realistic synthwave atmosphere */}
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-[#061321]/20 to-[#0F172A]/80 z-[4]" />
        
        {/* Subtle grid linear light overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay z-[5]"
          style={{
            backgroundImage: "linear-gradient(rgba(56, 189, 248, 0.3) 1px, transparent 1px)",
            backgroundSize: "100% 8px"
          }}
        />
      </div>

      {/* CORE CONTENT LAYERING (z-10, Center-Only layout) */}
      <div className="relative z-10 flex flex-col items-center gap-6 select-text">
        
        {/* Animated Headline Label */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15, duration: 0.45, ease: "easeOut" }}
          className="flex flex-col items-center gap-2"
        >
          <span className="font-mono text-[10px] tracking-[0.25em] uppercase font-bold text-sky-400/90 dark:text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.2)]">
            CORE MONITORING AGENT
          </span>
          <h4
            className="text-sm font-extrabold tracking-wider uppercase px-4 py-1.5 rounded-md border border-white/30"
            style={{
              fontFamily: "var(--font-serif)",
              color: "#000000",
              backgroundColor: "rgba(255,255,255,0.92)",
              boxShadow: "0 0 12px rgba(255,255,255,0.15)",
              display: "inline-block",
            }}
          >
            API Failure Detection Agent
          </h4>
        </motion.div>

        {/* Action Button: Go to Top ↑ (One Button Only, idle breathing, hover lift/glow, click compress) */}
        <motion.button
          onClick={handleScrollToTop}
          animate={{
            scale: [1, 1.02, 1],
          }}
          transition={{
            duration: 3,
            ease: "easeInOut",
            repeat: Infinity,
            repeatType: "reverse"
          }}
          whileHover={{ 
            scale: 1.05,
            y: -2,
            boxShadow: "0 0 15px rgba(37, 99, 235, 0.4)"
          }}
          whileTap={{ scale: 0.96 }}
          className="rounded-full border border-sky-500/20 bg-[#0d1e33]/50 backdrop-blur-md text-sky-400 font-mono text-[10px] font-bold tracking-[0.15em] uppercase py-2 px-6 shadow-[0_0_12px_rgba(37,99,235,0.1)] hover:border-sky-500/40 hover:text-white cursor-pointer transition-all duration-300"
        >
          Go to Top ↑
        </motion.button>

        {/* Copyright notice & GitHub Link */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-2 select-text text-[10px] font-mono text-neutral-400 dark:text-neutral-500">
          <span className="flex items-center gap-1" style={{ color: "#ffffff" }}>
            <span>© 2026 Agent Shastra. All rights reserved.</span>
          </span>
          <span className="hidden sm:inline text-neutral-600">|</span>
          <a
            href="https://www.github.com/techwithkishan"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sky-400 hover:text-white transition-colors cursor-pointer group"
          >
            <svg className="h-3.5 w-3.5 fill-current group-hover:scale-110 transition-transform" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
            </svg>
            <span>techwithkishan</span>
          </a>
        </div>

      </div>
    </motion.footer>
  );
}
