"use client";

import { useEffect, useRef } from "react";

export default function GridBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;
    // safe non-null alias — null was already guarded above
    const canvas: HTMLCanvasElement = canvasEl;
    const ctx = canvas.getContext("2d")!;
    const CELL = 48;
    let frame = 0;
    let animId: number;

    interface GlowCell {
      r: number;
      c: number;
      glowPhase: number;
      glowSpeed: number;
      isGlow: boolean;
    }

    let cols = 0;
    let rows = 0;
    let cells: GlowCell[] = [];

    function resize() {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      cols = Math.ceil(canvas.width / CELL) + 1;
      rows = Math.ceil(canvas.height / CELL) + 1;
      cells = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          cells.push({
            r,
            c,
            glowPhase: Math.random() * Math.PI * 2,
            glowSpeed: 0.002 + Math.random() * 0.004,
            isGlow: Math.random() < 0.06,
          });
        }
      }
    }

    function draw() {
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      frame++;

      // Vertical grid lines with wave animation
      for (let c = 0; c <= cols; c++) {
        const x = c * CELL;
        const t = (frame * 0.008 + c * 0.3) % (Math.PI * 2);
        ctx.strokeStyle = `rgba(160,120,10,${0.07 + Math.sin(t) * 0.04})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }

      // Horizontal grid lines with wave animation
      for (let r = 0; r <= rows; r++) {
        const y = r * CELL;
        const t = (frame * 0.006 + r * 0.25) % (Math.PI * 2);
        ctx.strokeStyle = `rgba(160,120,10,${0.07 + Math.sin(t) * 0.04})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      // Animated dots at every grid intersection
      for (let r = 0; r <= rows; r++) {
        for (let c = 0; c <= cols; c++) {
          const t = frame * 0.015 + r * 0.4 + c * 0.3;
          ctx.fillStyle = `rgba(160,120,10,${0.08 + Math.sin(t) * 0.07})`;
          ctx.beginPath();
          ctx.arc(c * CELL, r * CELL, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Radial glow pulses at random grid cells
      cells.forEach((cell) => {
        if (!cell.isGlow) return;
        cell.glowPhase += cell.glowSpeed;
        const a = Math.max(0, Math.sin(cell.glowPhase));
        if (a < 0.01) return;
        const x = cell.c * CELL;
        const y = cell.r * CELL;
        const grad = ctx.createRadialGradient(x, y, 0, x, y, CELL * 1.8);
        grad.addColorStop(0, `rgba(212,144,10,${a * 0.18})`);
        grad.addColorStop(0.5, `rgba(212,144,10,${a * 0.06})`);
        grad.addColorStop(1, `rgba(212,144,10,0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, CELL * 1.8, 0, Math.PI * 2);
        ctx.fill();
      });

      // Horizontal scan line moving top to bottom
      const scanY = ((frame * 0.6) % (H + 40)) - 20;
      const sg = ctx.createLinearGradient(0, scanY - 30, 0, scanY + 30);
      sg.addColorStop(0, "rgba(212,144,10,0)");
      sg.addColorStop(0.5, "rgba(212,144,10,0.06)");
      sg.addColorStop(1, "rgba(212,144,10,0)");
      ctx.fillStyle = sg;
      ctx.fillRect(0, scanY - 30, W, 60);

      // Vertical scan line moving left to right
      const scanX = ((frame * 0.4) % (W + 40)) - 20;
      const sg2 = ctx.createLinearGradient(scanX - 30, 0, scanX + 30, 0);
      sg2.addColorStop(0, "rgba(212,144,10,0)");
      sg2.addColorStop(0.5, "rgba(212,144,10,0.04)");
      sg2.addColorStop(1, "rgba(212,144,10,0)");
      ctx.fillStyle = sg2;
      ctx.fillRect(scanX - 30, 0, 60, H);

      animId = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener("resize", resize);
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    />
  );
}
