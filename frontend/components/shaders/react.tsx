"use client";

import { useEffect, useRef } from "react";

// --- FILM GRAIN ---
export function FilmGrain({ strength = 0.05 }: { strength?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    
    const resize = () => {
      canvas.width = canvas.offsetWidth || window.innerWidth;
      canvas.height = canvas.offsetHeight || window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const imgData = ctx.createImageData(canvas.width, canvas.height);
      const data = imgData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * strength * 255;
        data[i] = 128 + noise;     // R
        data[i + 1] = 128 + noise; // G
        data[i + 2] = 128 + noise; // B
        data[i + 3] = strength * 255; // A
      }
      
      ctx.putImageData(imgData, 0, 0);
      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, [strength]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none opacity-20 z-[15]"
    />
  );
}

// --- SWIRL ---
export function Swirl({ 
  colorA = "#ffffff", 
  colorB = "#f0f0f0", 
  detail = 1.7 
}: { 
  colorA?: string; 
  colorB?: string; 
  detail?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth || window.innerWidth;
      canvas.height = canvas.offsetHeight || window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const render = () => {
      time += 0.002;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Create swirly dynamic gradients using mathematical curves
      const gradient = ctx.createRadialGradient(
        canvas.width / 2 + Math.sin(time * detail) * 150,
        canvas.height / 2 + Math.cos(time * 0.7 * detail) * 100,
        10,
        canvas.width / 2 + Math.cos(time * 1.3) * 200,
        canvas.height / 2 + Math.sin(time * 0.9) * 150,
        canvas.width * 0.9
      );

      gradient.addColorStop(0, colorA);
      gradient.addColorStop(1, colorB);

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, [colorA, colorB, detail]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-[11]"
    />
  );
}

// --- CHROMADOW / CHROMAD FLOW ---
export function ChromaFlow({
  baseColor = "#ffffff",
  downColor = "#ff5f03",
  leftColor = "#ff5f03",
  rightColor = "#ff5f03",
  upColor = "#ff5f03",
  momentum = 13,
  radius = 3.5
}: {
  baseColor?: string;
  downColor?: string;
  leftColor?: string;
  rightColor?: string;
  upColor?: string;
  momentum?: number;
  radius?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;

    const resize = () => {
      canvas.width = canvas.offsetWidth || window.innerWidth;
      canvas.height = canvas.offsetHeight || window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Initialize floating blobs
    const blobs = [
      { x: 0.2, y: 0.3, vx: 0.0006, vy: 0.0009, color: leftColor },
      { x: 0.8, y: 0.7, vx: -0.0008, vy: -0.0005, color: rightColor },
      { x: 0.5, y: 0.2, vx: 0.0005, vy: 0.0008, color: upColor },
      { x: 0.3, y: 0.8, vx: -0.0006, vy: 0.0007, color: downColor },
    ];

    const render = () => {
      ctx.fillStyle = baseColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      blobs.forEach((blob) => {
        // Update positions using velocity and momentum factors
        blob.x += blob.vx * (momentum / 10);
        blob.y += blob.vy * (momentum / 10);

        // Boundary checks
        if (blob.x < 0.1 || blob.x > 0.9) blob.vx *= -1;
        if (blob.y < 0.1 || blob.y > 0.9) blob.vy *= -1;

        // Draw radial glowing blob
        const blobRadius = Math.max(canvas.width, canvas.height) * (radius / 25);
        const grad = ctx.createRadialGradient(
          blob.x * canvas.width,
          blob.y * canvas.height,
          0,
          blob.x * canvas.width,
          blob.y * canvas.height,
          blobRadius
        );

        grad.addColorStop(0, blob.color);
        grad.addColorStop(1, "transparent");

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(blob.x * canvas.width, blob.y * canvas.height, blobRadius, 0, Math.PI * 2);
        ctx.fill();
      });

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, [baseColor, downColor, leftColor, rightColor, upColor, momentum, radius]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none mix-blend-color-burn dark:mix-blend-screen opacity-40 z-[12]"
    />
  );
}

// --- FLUTED GLASS ---
export function FlutedGlass({
  aberration = 0.61,
  angle = 31,
  frequency = 8,
  highlight = 0.12,
  highlightSoftness = 0,
  lightAngle = -90,
  refraction = 4,
  shape = "rounded",
  softness = 1,
  speed = 0.15
}: {
  aberration?: number;
  angle?: number;
  frequency?: number;
  highlight?: number;
  highlightSoftness?: number;
  lightAngle?: number;
  refraction?: number;
  shape?: "rounded" | "square";
  softness?: number;
  speed?: number;
}) {
  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none z-[13] overflow-hidden flex">
      {/* Build highly realistic fluted lines using standard CSS gradients & flex layout */}
      {Array.from({ length: 48 }).map((_, idx) => (
        <div
          key={idx}
          className="h-full flex-1 border-r border-white/5 dark:border-black/5"
          style={{
            backdropFilter: `blur(${refraction * 2}px)`,
            background: `linear-gradient(90deg, 
              rgba(255,255,255, ${highlight}) 0%, 
              rgba(255,255,255, 0) 30%, 
              rgba(0,0,0, ${highlight * 0.5}) 70%, 
              rgba(255,255,255, ${highlight * 1.5}) 100%)`,
            boxShadow: `inset 1px 0 0 rgba(255,255,255, ${highlight * 0.8}), inset -1px 0 0 rgba(0,0,0, ${highlight * 0.3})`,
            transform: `skewX(${angle - 30}deg)`,
            opacity: 0.85,
          }}
        />
      ))}
    </div>
  );
}
