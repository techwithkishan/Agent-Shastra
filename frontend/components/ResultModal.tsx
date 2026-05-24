"use client";

import { useEffect } from "react";
import { X, Copy, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface ResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  rawJson: string;
}

export default function ResultModal({ isOpen, onClose, rawJson }: ResultModalProps) {
  const [copied, setCopied] = useState(false);

  // Close on ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rawJson);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay backdrop with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="relative w-full max-w-3xl overflow-hidden rounded-xl border border-neutral-800 bg-[#0d0d0d]/90 p-6 shadow-2xl backdrop-blur-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <h3 className="text-lg font-medium text-neutral-100">
                Raw Output Report (<code className="text-xs font-mono text-neutral-400">alert.json</code>)
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 rounded-md border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-neutral-100"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-green-500" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy JSON</span>
                    </>
                  )
                }
                </button>
                <button
                  onClick={onClose}
                  className="rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-neutral-900 hover:text-neutral-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Code Body */}
            <div className="mt-4 max-h-[60vh] overflow-y-auto rounded-lg bg-black p-4 font-mono text-xs border border-neutral-900 leading-relaxed">
              <pre className="whitespace-pre-wrap font-mono" style={{ color: "#ffffff" }}>{rawJson}</pre>
            </div>

            {/* Footer */}
            <div className="mt-4 flex justify-end gap-2 border-t border-neutral-800 pt-4 text-[10px] text-neutral-500 font-mono">
              Press [ESC] or click outside to dismiss
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
