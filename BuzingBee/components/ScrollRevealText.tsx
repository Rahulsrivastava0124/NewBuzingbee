"use client";

import { Fragment, useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * A big paragraph that "fills in" as you scroll: letters start pale peach and a
 * short gradient (orange to dark brown) sweeps through them, leaving solid text
 * behind. Small tilted tags pop onto chosen words once the sweep reaches them.
 * Progress is tied to scroll with GSAP ScrollTrigger, so it plays backwards too.
 */

export type RevealWord = {
  text: string;
  /** small tilted label that pops onto this word */
  tag?: string;
  /** tag tilt in degrees */
  tilt?: number;
};

type Props = {
  eyebrow?: string;
  words: RevealWord[];
  className?: string;
};

// how many letters the honey-to-amber sweep spans
const BAND = 22;
// bulge: half-width in letters (so ~8 letters swell) and peak growth
const BULGE_HALF = 4;
const BULGE_SCALE = 0.12;

type RGB = [number, number, number];
const hex = (h: string): RGB => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as RGB;
const PALE = hex("#f5d98a");
// not-yet-reached colour on the dark theme: a dim honey, so it reads as "unfilled"
const PALE_DARK = hex("#3a3118");
const HONEY = hex("#fdb905");
const AMBER = hex("#8a5a00");

const mix = (a: RGB, b: RGB, t: number): RGB => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

function colorAt(v: number, ink: RGB, pale: RGB): string {
  // 0 = not reached yet (pale yellow), 1 = done (ink)
  let c: RGB;
  if (v <= 0) c = pale;
  else if (v < 0.35) c = mix(pale, HONEY, v / 0.35);
  else if (v < 0.7) c = mix(HONEY, AMBER, (v - 0.35) / 0.35);
  else if (v < 1) c = mix(AMBER, ink, (v - 0.7) / 0.3);
  else c = ink;
  return `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
}

function parseRgb(css: string): RGB {
  const m = css.match(/\d+(\.\d+)?/g);
  return m ? [Number(m[0]), Number(m[1]), Number(m[2])] : [11, 11, 11];
}

export default function ScrollRevealText({ eyebrow, words, className = "" }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const pinEl = pinRef.current;
    const textEl = textRef.current;
    if (!pinEl || !textEl) return;

    const chars = Array.from(textEl.querySelectorAll<HTMLSpanElement>("[data-char]"));
    const tags = Array.from(textEl.querySelectorAll<HTMLSpanElement>("[data-tag]"));
    // final and start colours follow the theme (text-ink is light in dark mode);
    // re-read when the theme toggles, or the filled text keeps the old colour
    let ink: RGB = [0, 0, 0];
    let pale: RGB = PALE;
    const readTheme = () => {
      ink = parseRgb(getComputedStyle(textEl).color);
      pale = document.documentElement.classList.contains("dark") ? PALE_DARK : PALE;
    };
    readTheme();
    const total = chars.length;
    const last = new Array<string>(total).fill("");
    const lastBump = new Array<number>(total).fill(0);
    const tagShown = tags.map(() => false);

    tags.forEach((tag) => gsap.set(tag, { xPercent: -50, scale: 0.4, opacity: 0, rotate: 0 }));

    const paint = (p: number) => {
      const head = p * (total + BAND);
      // centre of the bulge sits where the sweep is brightest (honey)
      const bulgeCentre = head - BAND * 0.4;
      for (let i = 0; i < total; i++) {
        const v = Math.min(1, Math.max(0, (head - i) / BAND));
        const col = colorAt(v, ink, pale);
        if (col !== last[i]) {
          chars[i].style.color = col;
          last[i] = col;
        }
        // bulge: a soft lens rides the honey part of the sweep, swelling ~8 letters.
        // Cosine falloff, so the swell rises and settles with no visible edge.
        const d = (bulgeCentre - i) / BULGE_HALF;
        const bump = Math.abs(d) < 1 ? Math.round((0.5 + 0.5 * Math.cos(Math.PI * d)) * 1000) / 1000 : 0;
        if (bump !== lastBump[i]) {
          chars[i].style.transform = bump
            ? `translateY(${(-0.035 * bump).toFixed(4)}em) scale(${(1 + BULGE_SCALE * bump).toFixed(4)})`
            : "";
          lastBump[i] = bump;
        }
      }
      tags.forEach((tag, t) => {
        const at = Number(tag.dataset.at);
        const show = head - at > BAND * 0.5;
        if (show === tagShown[t]) return;
        tagShown[t] = show;
        gsap.to(tag, show
          ? { scale: 1, opacity: 1, rotate: Number(tag.dataset.tilt), duration: 0.5, ease: "back.out(2.2)" }
          : { scale: 0.4, opacity: 0, rotate: 0, duration: 0.25, ease: "power2.in" });
      });
    };

    let shown = 0;
    const themeWatch = new MutationObserver(() => {
      readTheme();
      last.fill(""); // force every letter to repaint
      paint(shown);
    });
    themeWatch.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      shown = 1;
      paint(1);
      return () => themeWatch.disconnect();
    }

    paint(0);

    // Scroll only sets a target. Every frame the shown progress glides toward it:
    // at a steady (linear) pace while it is far behind, easing out only at the very
    // end, so the fill keeps flowing for a moment after scrolling stops instead of
    // jumping with each wheel tick.
    let target = 0;
    const MAX_SPEED = 0.45; // progress per second at most (whole fill ≈ 2.2 s minimum)
    const CATCH_UP = 0.5; // seconds; how long the tail glides after scrolling stops

    const step = (_time: number, deltaMs: number) => {
      const gap = target - shown;
      if (Math.abs(gap) < 0.0002) {
        if (shown !== target) {
          shown = target;
          paint(shown);
        }
        return;
      }
      const dt = Math.min(deltaMs, 50) / 1000;
      const speed = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, gap / CATCH_UP));
      shown += speed * dt;
      if ((gap > 0 && shown > target) || (gap < 0 && shown < target)) shown = target;
      paint(shown);
    };
    gsap.ticker.add(step);

    // the screen sticks while the text fills in, then scrolls on; the fill finishes
    // a little before the pin ends so the finished paragraph rests for a moment
    const st = ScrollTrigger.create({
      trigger: pinEl,
      start: "top top",
      // long scroll distance: a small scroll moves the fill only a little
      end: "+=320%",
      pin: true,
      onUpdate: (self) => {
        target = Math.min(1, self.progress / 0.85);
      },
    });
    // layout above may still be settling (images, fonts)
    const refresh = window.setTimeout(() => ScrollTrigger.refresh(), 600);

    return () => {
      themeWatch.disconnect();
      window.clearTimeout(refresh);
      gsap.ticker.remove(step);
      st.kill();
      gsap.killTweensOf(tags);
    };
  }, [words]);

  let index = 0;

  return (
    <div ref={rootRef} className={className}>
      {/* text is centred in the space below the fixed navbar (top padding = navbar
          height), so the gaps above and below it match while pinned */}
      <div
        ref={pinRef}
        className="flex min-h-[100svh] items-center justify-center overflow-x-clip bg-paper px-4 pb-6 pt-28 sm:px-6 sm:pt-36 lg:px-12"
      >
      <div className="mx-auto max-w-[1440px] text-center">
        {eyebrow && (
          <p className="mb-8 text-[13px] font-semibold uppercase tracking-[0.12em] text-ink">{eyebrow}</p>
        )}
        <p
          ref={textRef}
          aria-label={words.map((w) => w.text).join(" ")}
          className="text-[clamp(32px,min(5.4vw,8.2svh),104px)] font-semibold leading-[1.1] tracking-[-0.03em] text-ink"
        >
          {words.map((w, wi) => {
            const start = index;
            index += w.text.length;
            return (
              <Fragment key={wi}>
                <span aria-hidden="true" className="relative inline-block whitespace-nowrap">
                  {Array.from(w.text).map((ch, ci) => (
                    <span
                      key={ci}
                      data-char=""
                      className="inline-block origin-[50%_70%]"
                      style={{ color: `rgb(${PALE.join(",")})` }}
                    >
                      {ch}
                    </span>
                  ))}
                  {w.tag && (
                    <span
                      data-tag=""
                      data-at={start}
                      data-tilt={w.tilt ?? -4}
                      className="pointer-events-none absolute left-1/2 top-[-0.1em] z-10 whitespace-nowrap rounded-full bg-gradient-to-r from-[#6d3df2] via-[#9b3ff0] to-[#e0349a] px-3 py-1.5 text-[12px] font-semibold tracking-normal text-white shadow-[0_6px_18px_rgba(155,63,240,0.35)] sm:px-5 sm:py-2.5 sm:text-[15px]"
                      style={{ opacity: 0, color: "#ffffff" }}
                    >
                      {w.tag}
                    </span>
                  )}
                </span>{" "}
              </Fragment>
            );
          })}
        </p>
      </div>
      </div>
    </div>
  );
}
