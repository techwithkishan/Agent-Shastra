"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CinematicIntroProps {
  onComplete: () => void;
}

export default function CinematicIntro({ onComplete }: CinematicIntroProps) {
  const [stage, setStage] = useState<"logo-draw" | "shining" | "elaborate" | "tagline" | "fadeout">("logo-draw");
  const [typedTagline, setTypedTagline] = useState("");
  const [showSkip, setShowSkip] = useState(false);

  const taglineText = "Your one stop API Failure Detection & Debugging Agent";

  useEffect(() => {
    // Stage 1: Logo Draw (0s to 1.0s)
    const shineTimer = setTimeout(() => {
      setStage("shining");
    }, 1000);

    // Stage 2: Shining Flare (1.0s to 1.7s)
    const elaborateTimer = setTimeout(() => {
      setStage("elaborate");
    }, 1700);

    // Stage 3: Elaboration & Border fade-in (1.7s to 2.8s)
    const taglineTimer = setTimeout(() => {
      setStage("tagline");
    }, 2850);

    // Show skip button after a short delay
    const skipTimer = setTimeout(() => {
      setShowSkip(true);
    }, 800);

    return () => {
      clearTimeout(shineTimer);
      clearTimeout(elaborateTimer);
      clearTimeout(taglineTimer);
      clearTimeout(skipTimer);
    };
  }, []);

  // Tagline typewriter effect
  useEffect(() => {
    if (stage !== "tagline") return;

    let index = 0;
    const interval = setInterval(() => {
      if (index <= taglineText.length) {
        setTypedTagline(taglineText.slice(0, index));
        index++;
      } else {
        clearInterval(interval);
        // Stage 5: Fadeout after completion (1.2s delay)
        setTimeout(() => {
          setStage("fadeout");
          setTimeout(onComplete, 800); // Trigger complete callback after fade transition
        }, 1200);
      }
    }, 25); // smooth, fast typewriter typing

    return () => clearInterval(interval);
  }, [stage, onComplete]);

  const handleSkip = () => {
    setStage("fadeout");
    setTimeout(onComplete, 500);
  };

  return (
    <AnimatePresence>
      {stage !== "fadeout" && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: "blur(12px)" }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#020203] overflow-hidden select-none"
        >
          {/* Pure solid dark background for intro loading */}

          {/* Skip Intro Button */}
          {showSkip && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              whileHover={{ opacity: 0.9, scale: 1.05 }}
              onClick={handleSkip}
              className="absolute top-6 right-6 px-4 py-1.5 border border-neutral-800 rounded-full text-[10px] uppercase font-mono tracking-widest text-neutral-400 cursor-pointer bg-neutral-950/40 z-50 transition-colors hover:border-indigo-500/40 hover:text-indigo-400"
            >
              Skip Intro
            </motion.button>
          )}

          {/* MAIN ANIMATION CONTAINER - Snug column structure with tight gap */}
          <div className="relative z-10 flex flex-col items-center justify-center max-w-2xl px-6 text-center gap-4">
            
            {/* 1. OUTLINE BORDER & TITLE BOX */}
            <motion.div
              layout
              initial={{ 
                borderColor: "rgba(99, 102, 241, 0)",
                boxShadow: "0 0 0px rgba(99, 102, 241, 0)",
                background: "rgba(255, 255, 255, 0)"
              }}
              animate={stage !== "logo-draw" && stage !== "shining" ? {
                borderColor: "rgba(99, 102, 241, 0.35)",
                boxShadow: "0 0 35px rgba(99, 102, 241, 0.12)",
                background: "rgba(7, 7, 10, 0.45)"
              } : {}}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="border border-transparent rounded-2xl px-8 py-5 flex items-center justify-center backdrop-blur-md relative overflow-hidden"
            >
              {/* Dynamic Shining reflection sheen sweep across the border container */}
              <AnimatePresence>
                {stage === "shining" && (
                  <motion.div
                    initial={{ x: "-150%" }}
                    animate={{ x: "150%" }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.7, ease: "easeInOut" }}
                    className="absolute inset-0 z-10 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 pointer-events-none"
                  />
                )}
              </AnimatePresence>

              <div className="flex items-center justify-center relative z-25">
                
                {/* SVG LOGO: Initial A & S */}
                <motion.div
                  layout
                  animate={stage === "shining" ? {
                    scale: [1, 1.1, 1],
                    filter: [
                      "brightness(1) drop-shadow(0 0 4px rgba(99,102,241,0.2))",
                      "brightness(2.2) drop-shadow(0 0 35px rgba(255,255,255,0.95))",
                      "brightness(1) drop-shadow(0 0 10px rgba(99,102,241,0.3))"
                    ]
                  } : {
                    scale: 1,
                    filter: "brightness(1) drop-shadow(0 0 8px rgba(99,102,241,0.2))"
                  }}
                  transition={stage === "shining" ? {
                    duration: 0.7,
                    ease: "easeInOut"
                  } : { duration: 0.3 }}
                  className="flex items-center justify-center relative"
                >
                  <svg
                    viewBox="0 0 160 120"
                    className="w-20 h-20 sm:w-24 sm:h-24 text-indigo-400 fill-current"
                  >
                    {/* Anthropic-inspired stylized "A" with organic apex and asymmetrical lines */}
                    <motion.path
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ duration: 0.8, ease: "easeInOut" }}
                      d="M 35 105 
                         C 35 105, 52 38, 55 25 
                         C 57 18, 62 14, 67 14 
                         C 70 14, 73 16, 75 20 
                         L 89 65 
                         L 51 65 
                         L 47 80 
                         L 93 80
                         L 100 105"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="11"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Attached helix-styled "S" connected directly from A's right foot */}
                    <motion.path
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ delay: 0.3, duration: 0.8, ease: "easeInOut" }}
                      d="M 98 94
                         C 112 94, 126 94, 132 88
                         C 138 82, 138 72, 132 66
                         C 124 58, 102 62, 94 54
                         C 88 48, 88 38, 94 32
                         C 100 26, 114 26, 128 26"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="11"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </motion.div>

                {/* ELABORATION LETTERS: "gent" and "hastra" */}
                <AnimatePresence>
                  {stage !== "logo-draw" && stage !== "shining" && (
                    <div className="flex items-center ml-2 sm:ml-4 overflow-hidden font-serif">
                      <motion.div
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="flex flex-row items-baseline gap-2 whitespace-nowrap text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight"
                      >
                        {/* Word "Agent" expanding from A */}
                        <div className="flex items-baseline">
                          <span className="text-indigo-400 font-bold">A</span>
                          <motion.span
                            initial={{ opacity: 0, x: -15 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.15, duration: 0.5 }}
                            className="text-neutral-100 font-serif"
                          >
                            gent
                          </motion.span>
                        </div>

                        {/* Word "Shastra" expanding from S */}
                        <div className="flex items-baseline ml-3 sm:ml-5">
                          <span className="text-indigo-400 font-bold">S</span>
                          <motion.span
                            initial={{ opacity: 0, x: -15 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                            className="text-neutral-100 font-serif"
                          >
                            hastra
                          </motion.span>
                        </div>

                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* 2. TAGLINE TYPEWRITER PANEL - Very small gap directly below the title */}
            <div className="min-h-[24px] mt-1 flex items-center justify-center">
              {stage !== "logo-draw" && stage !== "shining" && (
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="font-sans text-xs sm:text-sm tracking-wider leading-relaxed text-neutral-400 font-medium"
                >
                  {typedTagline}
                  {stage === "tagline" && (
                    <span className="inline-block w-1.5 h-3.5 ml-1 bg-indigo-400 align-middle animate-pulse" />
                  )}
                </motion.p>
              )}
            </div>

            {/* Glowing Bottom Status Bar */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={stage !== "logo-draw" && stage !== "shining" ? { scaleX: 1, opacity: 0.25 } : { scaleX: 0, opacity: 0 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="w-40 h-[1px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent mt-6"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
