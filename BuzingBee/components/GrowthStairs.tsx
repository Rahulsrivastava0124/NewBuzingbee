"use client";

import { motion, MotionConfig } from "framer-motion";
import { TrendingUp, Users } from "lucide-react";

/*
  Looping "growth story": steps rise one by one, the bee climbs them,
  the trend arrow draws upward, then the result badges pop in.
  Every element runs on the same CYCLE so the loop stays in sync.
*/
const CYCLE = 9; // seconds
const FADE_OUT = 8.2; // when the scene resets

const t = (sec: number) => sec / CYCLE;

// keyframes: hidden → shown at [start, start+dur] → hold → hidden at FADE_OUT
function play(start: number, dur = 0.6) {
  return {
    times: [0, t(start), t(start + dur), t(FADE_OUT), t(FADE_OUT + 0.5), 1],
    duration: CYCLE,
    repeat: Infinity,
    ease: "easeOut" as const,
  };
}
const show = (from: number, to: number) => [from, from, to, to, from, from];

const BASE = 520;
const STEPS = [
  { label: "Strategy", h: 80 },
  { label: "Content", h: 145 },
  { label: "Ads", h: 210 },
  { label: "SEO", h: 275 },
  { label: "Growth", h: 340 },
].map((s, i) => ({ ...s, x: 40 + i * 108, start: 0.3 + i * 0.6 }));

const STEP_W = 96;
const DEPTH = 16;

// bee lands on each step top just after it rises
const beeStops = STEPS.map((s) => ({
  x: s.x + STEP_W / 2 + DEPTH / 2,
  y: BASE - s.h - DEPTH - 22,
  at: s.start + 0.6,
}));
const beeX = [beeStops[0].x, ...beeStops.flatMap((b) => [b.x, b.x])];
const beeY = [
  BASE - 40,
  ...beeStops.flatMap((b, i) => [
    i === 0 ? BASE - 60 : b.y - 30, // small hop up before landing
    b.y,
  ]),
];
const beeTimes = [
  0,
  ...beeStops.flatMap((b) => [t(b.at - 0.25), t(b.at)]),
];

const TREND =
  "M 20 380 L 100 340 L 140 352 L 200 280 L 245 292 L 310 214 L 355 226 L 420 150 L 465 160 L 590 70";

export default function GrowthStairs() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="relative w-full max-w-[640px] aspect-[640/580] mx-auto font-jakarta">
        <svg
          viewBox="0 0 640 580"
          className="absolute inset-0 h-full w-full overflow-visible"
          role="img"
          aria-label="Growth steps from Strategy to Growth with a rising trend arrow"
        >
          <defs>
            <linearGradient id="gs-front" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffd23f" />
              <stop offset="100%" stopColor="#f5a300" />
            </linearGradient>
            <linearGradient id="gs-trend" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="#6d3df2" />
              <stop offset="60%" stopColor="#9b3ff0" />
              <stop offset="100%" stopColor="#e0349a" />
            </linearGradient>
            <radialGradient id="gs-glow">
              <stop offset="0%" stopColor="#fdb905" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#fdb905" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* backdrop: glow + faint chart grid */}
          <circle cx="360" cy="300" r="300" fill="url(#gs-glow)" />
          {[120, 220, 320, 420].map((y) => (
            <line
              key={y}
              x1="20"
              x2="620"
              y1={y}
              y2={y}
              stroke="#12141c"
              strokeOpacity="0.06"
              strokeDasharray="4 8"
            />
          ))}
          <line x1="20" x2="620" y1={BASE} y2={BASE} stroke="#12141c" strokeOpacity="0.15" strokeWidth="2" />

          {/* stairs */}
          {STEPS.map((s, i) => {
            const top = BASE - s.h;
            return (
              <motion.g
                key={s.label}
                style={{ originX: 0.5, originY: 1 }}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: show(0, 1) }}
                transition={play(s.start)}
              >
                {/* side face */}
                <path
                  d={`M ${s.x + STEP_W} ${top} l ${DEPTH} ${-DEPTH} V ${BASE - DEPTH} l ${-DEPTH} ${DEPTH} Z`}
                  fill="#d98a00"
                />
                {/* top face */}
                <path
                  d={`M ${s.x} ${top} l ${DEPTH} ${-DEPTH} h ${STEP_W} l ${-DEPTH} ${DEPTH} Z`}
                  fill="#ffe27a"
                />
                {/* front face */}
                <rect x={s.x} y={top} width={STEP_W} height={s.h} fill="url(#gs-front)" />
                <text
                  x={s.x + 12}
                  y={top + 26}
                  fontSize="12"
                  fontWeight="700"
                  fill="#12141c"
                  fillOpacity="0.45"
                >
                  0{i + 1}
                </text>
                <text x={s.x + 12} y={top + 46} fontSize="15" fontWeight="800" fill="#12141c">
                  {s.label}
                </text>
              </motion.g>
            );
          })}

          {/* rising trend line + arrow head */}
          <motion.path
            d={TREND}
            fill="none"
            stroke="url(#gs-trend)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: show(0, 1) }}
            transition={play(0.4, 3.4)}
          />
          <motion.path
            d="M 598 64 L 582 91 L 568 71 Z"
            fill="#e0349a"
            stroke="#e0349a"
            strokeWidth="4"
            strokeLinejoin="round"
            initial={{ opacity: 0 }}
            animate={{ opacity: show(0, 1) }}
            transition={play(3.7, 0.2)}
          />

          {/* climbing bee */}
          <motion.g
            initial={{ x: beeX[0], y: beeY[0], opacity: 0 }}
            animate={{ x: [...beeX, beeX.at(-1)!, beeX.at(-1)!], y: [...beeY, beeY.at(-1)! - 30, beeY.at(-1)! - 30], opacity: [0, ...beeStops.flatMap(() => [1, 1]), 0, 0] }}
            transition={{
              duration: CYCLE,
              repeat: Infinity,
              times: [...beeTimes, t(FADE_OUT + 0.5), 1],
              ease: "easeInOut",
            }}
          >
            <motion.g
              animate={{ scaleY: [1, 0.35, 1] }}
              transition={{ duration: 0.18, repeat: Infinity }}
              style={{ originX: 0.5, originY: 1 }}
            >
              <ellipse cx="-6" cy="-14" rx="9" ry="12" fill="#ffffff" stroke="#12141c" strokeWidth="1.5" opacity="0.9" />
              <ellipse cx="7" cy="-14" rx="9" ry="12" fill="#ffffff" stroke="#12141c" strokeWidth="1.5" opacity="0.9" />
            </motion.g>
            <ellipse cx="0" cy="0" rx="18" ry="13" fill="#fdb905" stroke="#12141c" strokeWidth="2" />
            <path d="M -6 -12 v 24 M 4 -12 v 24" stroke="#12141c" strokeWidth="4" />
            <circle cx="13" cy="-3" r="2.5" fill="#12141c" />
            <path d="M -18 0 l -7 3" stroke="#12141c" strokeWidth="2" strokeLinecap="round" />
          </motion.g>
        </svg>

        {/* result badges */}
        <motion.div
          className="absolute right-[2%] top-[2%] rounded-full bg-[#12141c] px-4 py-2 text-sm font-extrabold text-white shadow-lg"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: show(0, 1), scale: show(0.6, 1) }}
          transition={play(3.9, 0.4)}
        >
          <span className="text-[#fdb905]">+320%</span> Growth
        </motion.div>

        <motion.div
          className="absolute left-[4%] top-[8%] flex items-center gap-3 rounded-2xl border border-[#fdb905]/30 bg-white/90 px-4 py-3 shadow-[0_14px_34px_rgba(18,20,28,0.10)] backdrop-blur"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: show(0, 1), y: show(16, 0) }}
          transition={play(4.3, 0.5)}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fdb905]/20">
            <Users className="h-5 w-5 text-[#d98a00]" />
          </span>
          <span>
            <span className="block text-xs font-medium text-[#12141c]/60">Monthly Leads</span>
            <span className="block text-lg font-extrabold text-[#12141c]">+248%</span>
          </span>
        </motion.div>

        <motion.div
          className="absolute right-[0%] top-[42%] flex items-center gap-3 rounded-2xl border border-[#fdb905]/30 bg-white/90 px-4 py-3 shadow-[0_14px_34px_rgba(18,20,28,0.10)] backdrop-blur"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: show(0, 1), y: show(16, 0) }}
          transition={play(4.7, 0.5)}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6d3df2]/10">
            <TrendingUp className="h-5 w-5 text-[#6d3df2]" />
          </span>
          <span>
            <span className="block text-xs font-medium text-[#12141c]/60">Ad ROI</span>
            <span className="block text-lg font-extrabold text-[#12141c]">4.8x</span>
          </span>
        </motion.div>
      </div>
    </MotionConfig>
  );
}
