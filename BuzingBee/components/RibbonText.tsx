"use client";

import { useEffect, useId, useRef, useState } from "react";

/**
 * Wavy ribbons with text scrolling along them.
 *
 * Each ribbon is an SVG band drawn around a sine-wave centre line. The wave
 * slowly travels, the band's thickness swells and narrows (which reads as the
 * ribbon twisting toward and away from the viewer), and the text runs along
 * the centre line via <textPath>. Everything is recomputed per animation frame
 * from the container's real pixel size, so text never stretches.
 */

export type Ribbon = {
  text: string;
  /** ribbon fill */
  bg: string;
  /** text colour */
  fg: string;
  /** vertical position of the centre line, 0 (top) to 1 (bottom) */
  y?: number;
  /** wave height in px */
  amplitude?: number;
  /** number of wave crests across the width */
  frequency?: number;
  /** ribbon thickness in px */
  width?: number;
  /** text scroll speed in px/s */
  speed?: number;
  direction?: "left" | "right";
  /** shifts this ribbon's wave so stacked ribbons don't move in lockstep */
  phase?: number;
};

type Props = {
  ribbons: Ribbon[];
  separator?: string;
  className?: string;
};

const POINTS = 90;

// On narrow screens the ribbon, its text and its wave shrink together, and the wave
// keeps a desktop-like length so it doesn't bunch up into steep peaks on phones.
const DESIGN_WIDTH = 1100;
const MIN_WAVE_LENGTH = 900;
const scaleFor = (w: number) => Math.min(1, Math.max(0.55, w / DESIGN_WIDTH));
// the band itself shrinks less than the wave, so it stays thick on phones
const thicknessFor = (w: number) => Math.min(1, Math.max(0.8, w / DESIGN_WIDTH));

export default function RibbonText({ ribbons, separator = "  •  ", className = "" }: Props) {
  const uid = "rb" + useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const wrapRef = useRef<HTMLDivElement>(null);
  const bandRefs = useRef<(SVGPathElement | null)[]>([]);
  const lineRefs = useRef<(SVGPathElement | null)[]>([]);
  const textPathRefs = useRef<(SVGTextPathElement | null)[]>([]);
  const measureRefs = useRef<(SVGTextElement | null)[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [repeats, setRepeats] = useState<number[]>(() => ribbons.map(() => 6));

  // track container size
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ w: Math.round(width), h: Math.round(height) });
    });
    ro.observe(el);
    // first size right away (ResizeObserver waits for the next rendered frame)
    const rect = el.getBoundingClientRect();
    setSize({ w: Math.round(rect.width), h: Math.round(rect.height) });
    return () => ro.disconnect();
  }, []);

  // measure one "text + separator" unit per ribbon, repeat enough to cover the path
  useEffect(() => {
    if (!size.w) return;
    const next = ribbons.map((_, i) => {
      const unit = measureRefs.current[i]?.getComputedTextLength() || 200;
      return Math.ceil((size.w * 1.8) / unit) + 2;
    });
    setRepeats((prev) => (prev.join() === next.join() ? prev : next));
  }, [size.w, ribbons]);

  // animate
  useEffect(() => {
    const { w, h } = size;
    if (!w || !h) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const units = ribbons.map((_, i) => measureRefs.current[i]?.getComputedTextLength() || 200);
    let raf = 0;
    let running = true;
    let last = performance.now();
    let t = 0;

    const draw = () => {
      ribbons.forEach((r, i) => {
        const band = bandRefs.current[i];
        const line = lineRefs.current[i];
        const tp = textPathRefs.current[i];
        if (!band || !line || !tp) return;

        const sc = scaleFor(w);
        const amp = (r.amplitude ?? h * 0.22) * sc;
        const freq = r.frequency ?? 1.1;
        const half = ((r.width ?? 64) * thicknessFor(w)) / 2;
        const cy = (r.y ?? 0.5) * h;
        const ph = r.phase ?? 0;
        const k = (Math.PI * 2 * freq) / Math.max(w, MIN_WAVE_LENGTH);

        const yAt = (x: number) =>
          cy + amp * Math.sin(k * x + t * 0.6 + ph) + amp * 0.25 * Math.sin(k * 0.5 * x - t * 0.35 + ph * 2);

        const top: string[] = [];
        const bottom: string[] = [];
        const centre: string[] = [];
        const x0 = -80;
        const x1 = w + 80;
        for (let p = 0; p <= POINTS; p++) {
          const x = x0 + ((x1 - x0) * p) / POINTS;
          const y = yAt(x);
          // normal from the slope, so the band keeps an even thickness on steep parts
          const dy = yAt(x + 1) - yAt(x - 1);
          const len = Math.hypot(2, dy);
          const nx = -dy / len;
          const ny = 2 / len;
          // thickness breathes along the length = fake twist toward/away from the viewer
          const hw = half * (0.72 + 0.28 * Math.cos(k * 0.8 * x + t * 0.9 + ph));
          top.push(`${(x + nx * hw).toFixed(1)},${(y - ny * hw).toFixed(1)}`);
          bottom.push(`${(x - nx * hw).toFixed(1)},${(y + ny * hw).toFixed(1)}`);
          centre.push(`${x.toFixed(1)},${y.toFixed(1)}`);
        }
        band.setAttribute("d", `M${top.join("L")}L${bottom.reverse().join("L")}Z`);
        line.setAttribute("d", `M${centre.join("L")}`);

        const unit = units[i];
        const travel = (t * (r.speed ?? 70)) % unit;
        const offset = (r.direction ?? "left") === "left" ? -travel : travel - unit;
        tp.setAttribute("startOffset", offset.toFixed(1));
      });
    };

    const tick = (now: number) => {
      t += Math.min(0.05, (now - last) / 1000);
      last = now;
      draw();
      if (running) raf = requestAnimationFrame(tick);
    };

    draw();
    if (reduceMotion) return;

    // only animate while on screen
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !running) {
        running = true;
        last = performance.now();
        raf = requestAnimationFrame(tick);
      } else if (!entry.isIntersecting && running) {
        running = false;
        cancelAnimationFrame(raf);
      }
    });
    if (wrapRef.current) io.observe(wrapRef.current);
    raf = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [size, ribbons, repeats]);

  const label = ribbons.map((r) => r.text).join(". ");

  return (
    <div ref={wrapRef} className={`relative w-full overflow-hidden ${className}`} role="img" aria-label={label}>
      {size.w > 0 && (
        <svg width={size.w} height={size.h} viewBox={`0 0 ${size.w} ${size.h}`} className="absolute inset-0" aria-hidden="true">
          {ribbons.map((r, i) => {
            const fontSize = Math.round((r.width ?? 64) * thicknessFor(size.w) * 0.42);
            const unitText = `${r.text}${separator}`;
            return (
              <g key={i}>
                {/* hidden: measures one repeat unit */}
                <text
                  ref={(el) => {
                    measureRefs.current[i] = el;
                  }}
                  x={-9999}
                  y={-9999}
                  fontSize={fontSize}
                  fontWeight={700}
                  letterSpacing="0.06em"
                  style={{ whiteSpace: "pre" }}
                >
                  {unitText}
                </text>
                <path
                  ref={(el) => {
                    lineRefs.current[i] = el;
                  }}
                  id={`${uid}-line-${i}`}
                  fill="none"
                />
                <path
                  ref={(el) => {
                    bandRefs.current[i] = el;
                  }}
                  fill={r.bg}
                />
                <text
                  fill={r.fg}
                  fontSize={fontSize}
                  fontWeight={700}
                  letterSpacing="0.06em"
                  dominantBaseline="central"
                  style={{ whiteSpace: "pre" }}
                >
                  <textPath
                    ref={(el) => {
                      textPathRefs.current[i] = el;
                    }}
                    href={`#${uid}-line-${i}`}
                  >
                    {unitText.repeat(repeats[i] ?? 6)}
                  </textPath>
                </text>
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}
