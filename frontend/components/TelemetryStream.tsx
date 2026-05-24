"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface TelemetryStreamProps {
  status: "idle" | "dragging" | "processing" | "success" | "error";
  result: any;
  theme: "dark" | "light";
}

const POINT_COUNT = 80;
const FLAT_VALUE = 50; // centre of the 0-100 viewBox

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export default function TelemetryStream({ status, result, theme }: TelemetryStreamProps) {
  // Displayed (smoothed) points
  const [points, setPoints] = useState<number[]>(Array(POINT_COUNT).fill(FLAT_VALUE));

  // Target points that we lerp towards each frame
  const targetRef = useRef<number[]>(Array(POINT_COUNT).fill(FLAT_VALUE));
  const displayRef = useRef<number[]>(Array(POINT_COUNT).fill(FLAT_VALUE));
  const rafRef = useRef<number | null>(null);
  const isActiveRef = useRef(false);

  // Determine whether the graph should animate
  const shouldAnimate = status === "processing" || status === "success";

  // Push a new target value on the right and shift left
  const pushTarget = useCallback(() => {
    let h = FLAT_VALUE;
    if (status === "processing") {
      h = 15 + Math.random() * 70;
    } else if (status === "success" && result?.total_incidents > 0) {
      h = 65 + Math.random() * 25;
    } else if (status === "success") {
      h = 40 + Math.random() * 15;
    }
    targetRef.current = [...targetRef.current.slice(1), h];
  }, [status, result]);

  useEffect(() => {
    if (!shouldAnimate) {
      // Cancel any running loop and snap everything to flat
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      isActiveRef.current = false;
      const flat = Array(POINT_COUNT).fill(FLAT_VALUE);
      targetRef.current = [...flat];
      displayRef.current = [...flat];
      setPoints([...flat]);
      return;
    }

    isActiveRef.current = true;

    // Seed initial targets so animation feels alive from frame 1
    targetRef.current = Array.from({ length: POINT_COUNT }, () =>
      status === "processing" ? 15 + Math.random() * 70 : 40 + Math.random() * 15
    );

    let lastPush = 0;
    const PUSH_INTERVAL = 120; // ms between new data points

    const tick = (now: number) => {
      if (!isActiveRef.current) return;

      // Push a new target value every PUSH_INTERVAL ms
      if (now - lastPush >= PUSH_INTERVAL) {
        pushTarget();
        lastPush = now;
      }

      // Lerp display towards target — very smooth
      displayRef.current = displayRef.current.map((v, i) =>
        lerp(v, targetRef.current[i], 0.18)
      );

      setPoints([...displayRef.current]);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      isActiveRef.current = false;
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [shouldAnimate, pushTarget, status]);

  // Build SVG polyline points string
  const svgPoints = points
    .map((val, idx) => `${(idx / (POINT_COUNT - 1)) * 300},${val}`)
    .join(" ");

  // Grid colours
  const gridColor = theme === "dark" ? "rgba(0,255,136,0.06)" : "rgba(0,180,80,0.09)";
  const lineColor = theme === "dark" ? "#00ff88" : "#16a34a";
  const glowColor = theme === "dark" ? "rgba(0,255,136,0.25)" : "rgba(22,163,74,0.20)";
  const bgColor = theme === "dark" ? "rgba(0,10,5,0.6)" : "rgba(240,255,248,0.85)";
  const borderColor = theme === "dark" ? "#0d2a1a" : "#bbf7d0";

  return (
    <div
      className="relative w-full rounded-lg overflow-hidden"
      style={{
        height: "80px",
        border: `1px solid ${borderColor}`,
        background: bgColor,
        transition: "border-color 0.3s, background 0.3s",
      }}
    >
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 300 100"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Small grid squares pattern */}
          <pattern id="tele-grid" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
            <path
              d="M 10 0 L 0 0 0 10"
              fill="none"
              stroke={gridColor}
              strokeWidth="0.6"
            />
          </pattern>

          {/* Glow filter for the line */}
          <filter id="tele-glow" x="-20%" y="-80%" width="140%" height="260%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Gradient fill under the line */}
          <linearGradient id="tele-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0.18" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid background */}
        <rect width="300" height="100" fill="url(#tele-grid)" />

        {/* Soft area fill under the wave */}
        <polygon
          points={`${svgPoints} 300,100 0,100`}
          fill="url(#tele-fill)"
        />

        {/* Main wave line */}
        <polyline
          fill="none"
          stroke={lineColor}
          strokeWidth="1.8"
          strokeLinejoin="round"
          strokeLinecap="round"
          points={svgPoints}
          filter="url(#tele-glow)"
          style={{ vectorEffect: "non-scaling-stroke" }}
        />

        {/* Leading dot at right edge */}
        {(() => {
          const last = points[points.length - 1];
          const x = 300;
          const y = last;
          return (
            <circle cx={x} cy={y} r="3" fill={lineColor} opacity="0.9">
              <animate
                attributeName="opacity"
                values="0.9;0.3;0.9"
                dur="1.2s"
                repeatCount="indefinite"
              />
            </circle>
          );
        })()}
      </svg>

      {/* Idle / error label overlay */}
      {!shouldAnimate && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ zIndex: 2 }}
        >
          <span
            className="font-mono text-[9px] uppercase tracking-[0.2em]"
            style={{ color: theme === "dark" ? "#00ff88" : "#15803d" }}
          >
            AWAITING SIGNAL
          </span>
        </div>
      )}
    </div>
  );
}
