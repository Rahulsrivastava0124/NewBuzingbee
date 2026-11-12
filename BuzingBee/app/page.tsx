"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Code2,
  Target,
  Mail,
  ArrowUpRight,
  PlayCircle,
  Layers,
  BarChart3,
  Headphones,
  Share2,
  FileText,
} from "lucide-react";
import HeroStories from "@/components/HeroStories";
import ServiceRevealCard from "@/components/ServiceRevealCard";
import ServicesGrid from "@/components/ServicesGrid";
import ProjectsMarquee from "@/components/ProjectsMarquee";
import { Highlighter } from "@/components/ui/highlighter";
import dynamic from "next/dynamic";

// decorative and computed with trig, whose last decimals differ between Node and browsers;
// render it client-only so server and client HTML always match
const HexagonPattern = dynamic(
  () => import("@/components/ui/hexagon-pattern").then((m) => m.HexagonPattern),
  { ssr: false },
);
import { RollingText } from "@/components/animate-ui/primitives/texts/rolling";
import { openAuditPopup } from "@/lib/audit-popup";

/* ── shared styles for the sections below the hero ── */
const WRAP = "max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12";
const H2 =
  "text-[32px] sm:text-[40px] font-semibold leading-[1.2] tracking-[-0.02em] text-ink";
const LEAD = "text-[17px] leading-relaxed text-slate";
const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2";
const BTN_INK = "btn-dark";
const BTN_HONEY = "btn-honey";
const TEXT_LINK = `w-fit rounded text-[15px] font-semibold text-ink underline decoration-[#fdb905] decoration-2 underline-offset-[6px] hover:decoration-ink ${FOCUS}`;

// logos from svglogos.dev (CC0) unless noted; heights tuned so the marks read at a similar size.
// invertDark: black wordmarks; in dark mode invert + hue-rotate(180) flips light/dark but keeps hues
const BRANDS = [
  { name: "Google", src: "/brands/google.svg", h: "h-7" },
  { name: "Meta", src: "/brands/meta.svg", h: "h-6", invertDark: true },
  { name: "Instagram", src: "/brands/instagram.svg", h: "h-7", invertDark: true },
  { name: "YouTube", src: "/brands/youtube.svg", h: "h-6", invertDark: true },
  { name: "LinkedIn", src: "/brands/linkedin.svg", h: "h-6" },
  { name: "Shopify", src: "/brands/shopify.svg", h: "h-7", label: true },
  // Hostinger + PhonePe: Simple Icons (CC0); Cashfree: Wikimedia Commons (public domain)
  { name: "Hostinger", src: "/brands/hostinger.svg", h: "h-6", label: true },
  { name: "Cashfree", src: "/brands/cashfree.svg", h: "h-5", invertDark: true },
  { name: "PhonePe", src: "/brands/phonepe.svg", h: "h-6", label: true },
];

const SERVICE_OVERVIEW = [
  {
    icon: Search,
    title: "Search Engine Optimization (SEO)",
    desc: "Rank higher, get found, and bring in organic traffic.",
    href: "#all-services",
  },
  {
    icon: BarChart3,
    title: "Google Ads",
    desc: "Target the right audience and get instant results.",
    href: "#all-services",
  },
  {
    icon: Share2,
    title: "Social Media Marketing",
    desc: "Build your brand and engage your audience.",
    href: "#all-services",
  },
  {
    icon: FileText,
    title: "Content Marketing",
    desc: "Valuable content that builds trust and drives sales.",
    href: "#all-services",
  },
  {
    icon: Code2,
    title: "Website Design & Development",
    desc: "Modern websites that convert visitors into customers.",
    href: "#all-services",
  },
  {
    icon: Mail,
    title: "Email Marketing",
    desc: "Nurture leads and boost customer loyalty.",
    href: "#all-services",
  },
];

// grid dividers: stacked on mobile, 2 columns on sm, 3 columns on lg
function overviewBorders(i: number) {
  return [
    i > 0 ? "border-t" : "",
    i < 2 ? "sm:border-t-0" : "sm:border-t",
    i % 2 === 1 ? "sm:border-l" : "sm:border-l-0",
    i < 3 ? "lg:border-t-0" : "lg:border-t",
    i % 3 === 0 ? "lg:border-l-0" : "lg:border-l",
  ].join(" ");
}

// honey-filled cells in the hero honeycomb, as [column, row]
const HERO_HEXAGONS: [number, number][] = [
  [9, 2], [13, 1], [15, 4], [18, 2], [20, 6], [22, 3], [17, 8], [24, 5], [12, 7], [6, 5],
];

// agency services cycled in the hero headline ("Performance <service>")
const HERO_SERVICES = [
  "Marketing",
  "SEO",
  "Google Ads",
  "Meta Ads",
  "Social Media",
  "Websites",
  "Mobile Apps",
  "E-commerce",
  "AI Chatbots",
  "AI Automation",
  "GEO & AEO",
  "Local SEO",
];

// hero word gradient: violet → purple → pink
const WORD_GRADIENT = ["#6d3df2", "#9b3ff0", "#e0349a"];

function gradientAt(t: number) {
  const seg = Math.min(Math.floor(t * (WORD_GRADIENT.length - 1)), WORD_GRADIENT.length - 2);
  const local = t * (WORD_GRADIENT.length - 1) - seg;
  const [a, b] = [WORD_GRADIENT[seg], WORD_GRADIENT[seg + 1]].map((hex) =>
    [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)),
  );
  return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * local)).join(",")})`;
}

// a gradient can't clip across 3D-flipping letters, so each letter gets its own slice
const letterGradient = (i: number, total: number): React.CSSProperties => ({
  backgroundImage: `linear-gradient(90deg, ${gradientAt(i / total)}, ${gradientAt((i + 1) / total)})`,
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
});

// rolls each service in (Animate UI Rolling Text), holds, then moves to the next
function RollingWord({ words }: { words: string[] }) {
  const [index, setIndex] = useState(0);
  const word = words[index];
  // reserve the longest word's width so the line never reflows between words
  const longest = words.reduce((a, b) => (b.length > a.length ? b : a));

  useEffect(() => {
    // roll-in takes ~0.1s per letter + 0.8s, then hold for 2s
    const id = setTimeout(
      () => setIndex((i) => (i + 1) % words.length),
      word.length * 100 + 800 + 2000,
    );
    return () => clearTimeout(id);
  }, [word, words.length]);

  return (
    <span className="relative inline-block">
      <span className="sr-only">{words.join(", ")}</span>
      <span aria-hidden="true" className="invisible">
        {longest}
      </span>
      <span aria-hidden="true" className="absolute left-1/2 top-0 -translate-x-1/2 whitespace-nowrap lg:left-0 lg:translate-x-0">
        <RollingText key={index} text={word} charStyle={letterGradient} />
      </span>
      {/* squiggle sized to the current word, redrawn for each new one */}
      <span aria-hidden="true" className="absolute left-1/2 top-0 -translate-x-1/2 whitespace-nowrap lg:left-0 lg:translate-x-0">
        <span className="invisible">{word}</span>
        <motion.svg
          key={index}
          viewBox="0 0 260 24"
          preserveAspectRatio="none"
          className="absolute left-0 -bottom-5 h-[0.4em] w-full"
          fill="none"
          initial={{ clipPath: "inset(0 100% 0 0)" }}
          animate={{ clipPath: "inset(0 0% 0 0)" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <path
            d="M4 18 C 50 6, 90 4, 120 10 C 140 14, 110 22, 135 16 C 170 8, 220 6, 256 12"
            stroke="#fdb905"
            strokeWidth="4"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </motion.svg>
      </span>
    </span>
  );
}

export default function HomePage() {
  return (
    <>
      {/* ══════════════════════════════════════════
          1. HERO SECTION
      ══════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-paper font-jakarta lg:min-h-screen">
        {/* honeycomb (Magic UI Hexagon Pattern): faint lines, a few honey cells, faded at the edges */}
        <HexagonPattern
          radius={34}
          gap={3}
          hexagons={HERO_HEXAGONS}
          className="fill-[#fdb905]/20 stroke-ink/[0.07] [mask-image:radial-gradient(ellipse_80%_75%_at_65%_40%,black_25%,transparent_80%)]"
        />
        {/* yellow swooshes */}
        <svg
          aria-hidden="true"
          viewBox="0 0 1440 900"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full pointer-events-none"
        >
          <defs>
            <linearGradient id="hero-swoosh" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="#fdb905" stopOpacity="0" />
              <stop offset="45%" stopColor="#fdb905" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#fdb905" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="hero-wave" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ffe9a8" stopOpacity="0" />
              <stop offset="55%" stopColor="#ffd23f" />
              <stop offset="100%" stopColor="#fdb905" />
            </linearGradient>
            <radialGradient id="hero-glow" cx="0" cy="1" r="1">
              <stop offset="0%" stopColor="#ffd23f" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#fff4cc" stopOpacity="0" />
            </radialGradient>
          </defs>
          <path className="hidden lg:block" d="M 690 320 Q 860 120 1120 62 Q 880 140 690 320 Z" fill="url(#hero-swoosh)" />
          <path d="M 0 560 Q 160 760 420 900 L 0 900 Z" fill="url(#hero-glow)" />
          <path className="dark:opacity-10" d="M 700 900 Q 1160 880 1440 610 L 1440 900 Z" fill="#fff1c2" opacity="0.7" />
          <path d="M 860 900 Q 1240 860 1440 680 L 1440 900 Z" fill="url(#hero-wave)" />
        </svg>
        {/* fade the waves into white so the hero blends into the brands strip below */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent via-paper/70 to-paper"
        />

        <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 pt-28 md:pt-36 lg:pt-40 pb-16 lg:pb-20 grid lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-6 items-center">
          {/* centred on phones/tablets, left-aligned beside the animation on desktop */}
          <div className="text-center lg:text-left">
            <h1 className="font-jakarta text-[30px] sm:text-[40px] xl:text-[46px] leading-[1.15] tracking-[-0.02em] text-ink">
              <span className="block font-medium">Grow Your Business with</span>
              <span className="relative mt-4 block font-extrabold">
                {/* hand-drawn honey marker (Magic UI Highlighter); text stays dark on yellow */}
                <span className="mr-1 text-[#12141c]">
                  <Highlighter action="highlight" color="#fdb905" padding={6} animationDuration={900}>
                    Performance
                  </Highlighter>
                </span>{" "}
                <RollingWord words={HERO_SERVICES} />
              </span>
            </h1>

            <p className="mt-12 max-w-[620px] text-lg xl:text-[20px] leading-relaxed text-ink/75">
              We help brands build a strong digital presence, generate quality
              leads, and accelerate growth with smart marketing strategies,
              creative content, and AI-driven solutions.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4 sm:gap-6 lg:justify-start">
              <button type="button" onClick={() => openAuditPopup()} className={BTN_HONEY}>
                Let&apos;s Grow Together
                <ArrowUpRight className="w-4 h-4" />
              </button>
              <a href="#all-services" className="btn-light hidden sm:inline-flex">
                <PlayCircle className="w-5 h-5" />
                Explore Services
              </a>
            </div>

            <div className="mt-14 grid grid-cols-2 justify-items-center gap-y-6 text-left sm:flex sm:flex-nowrap sm:justify-center lg:justify-start">
              {[
                { icon: Target, line1: "Strategy", line2: "That Works" },
                { icon: Layers, line1: "Creative", line2: "That Connects" },
                { icon: BarChart3, line1: "AI-Powered", line2: "Growth" },
                { icon: Headphones, line1: "Dedicated", line2: "Support" },
              ].map(({ icon: Icon, line1, line2 }, i) => (
                <div
                  key={line1}
                  className={`flex items-center gap-2.5 pr-4 2xl:pr-7 ${
                    i > 0 ? "sm:border-l sm:border-ink/15 sm:pl-4 2xl:pl-7" : ""
                  }`}
                >
                  <Icon className="w-6 h-6 2xl:w-7 2xl:h-7 shrink-0 text-[#fdb905]" strokeWidth={2} />
                  <span className="text-[14px] 2xl:text-[16px] font-medium leading-snug whitespace-nowrap text-ink/85">
                    {line1}
                    <br />
                    {line2}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <HeroStories />
        </div>
      </section>

      {/* ══════════════════════════════════════════
          2. BRANDS + SERVICES OVERVIEW
      ══════════════════════════════════════════ */}
      <section className="bg-paper">
        {/* full-bleed top/bottom lines; content stays on the page grid */}
        <div className="border-y border-ink/10">
          <div className={`${WRAP} flex flex-col lg:flex-row lg:items-stretch`}>
            <p className="flex shrink-0 items-center pt-6 text-[15px] text-slate lg:py-8 lg:pr-10">
              Worked with Global Brands &amp; Startups
            </p>
            {/* marquee: list rendered twice and slid -50% so the loop is seamless */}
            <div className="min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
              <div className="marquee flex h-full w-max">
                {[0, 1].map((copy) => (
                  <ul key={copy} className="flex" aria-hidden={copy === 1}>
                    {BRANDS.map((brand) => (
                      <li
                        key={brand.name}
                        className="flex shrink-0 items-center gap-2 border-l border-ink/10 px-8 py-6 lg:py-8 xl:px-10"
                      >
                        <img
                          src={brand.src}
                          alt={brand.label ? "" : brand.name}
                          className={`${brand.h} w-auto ${
                            "invertDark" in brand ? "dark:invert dark:hue-rotate-180" : ""
                          }`}
                        />
                        {brand.label && (
                          <span className="text-lg font-semibold text-ink">{brand.name}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className={WRAP}>
          {/* section label, centred across the whole block */}
          <p id="about" className="scroll-mt-4 flex items-center justify-center gap-4 pt-20 text-[15px] font-semibold uppercase tracking-[0.08em] text-ink lg:pt-24">
            <span className="h-[3px] w-12 rounded-full bg-[#fdb905]" />
            Our Services
            <span className="h-[3px] w-12 rounded-full bg-[#fdb905]" />
          </p>
          <div className="grid gap-12 pb-20 pt-10 lg:pb-24 min-[1400px]:grid-cols-[0.85fr_2fr] min-[1400px]:gap-8">
            <div>
              <h2 className={`${H2} !leading-[1.3]`}>
                End-to-End{" "}
                <span className="rounded-lg bg-[#fdb905]/30 px-2 [box-decoration-break:clone]">Digital</span>{" "}
                <span className="rounded-lg bg-[#6d3df2]/10 px-2 [box-decoration-break:clone]">
                  <span className="bg-gradient-to-r from-[#6d3df2] via-[#9b3ff0] to-[#e0349a] bg-clip-text text-transparent">
                    Marketing
                  </span>
                </span>{" "}
                Solutions
              </h2>
              <p className={`mt-6 max-w-[34ch] ${LEAD} sm:text-[19px]`}>
                From strategy to performance, we handle everything you need to
                grow online.
              </p>
              <a href="#all-services" className={`mt-8 ${BTN_HONEY}`}>
                View All Services
                <ArrowUpRight className="h-5 w-5" />
              </a>
            </div>

            <ul className="grid auto-rows-fr sm:grid-cols-2 lg:grid-cols-3">
              {SERVICE_OVERVIEW.map((svc, i) => (
                <li
                  key={svc.title}
                  className={`border-ink/10 ${overviewBorders(i)}`}
                >
                  <ServiceRevealCard {...svc} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          3. RECENT PROJECTS (navbar "Our Work")
      ══════════════════════════════════════════ */}
      <section id="work" className="scroll-mt-4 bg-comb/50 py-20 lg:py-28">
        <div className={WRAP}>
          <p className="flex items-center justify-center gap-4 text-[15px] font-semibold uppercase tracking-[0.08em] text-ink">
            <span className="h-[3px] w-12 rounded-full bg-[#fdb905]" />
            Our Work
            <span className="h-[3px] w-12 rounded-full bg-[#fdb905]" />
          </p>
          <h2 className={`${H2} mt-6 text-center`}>Recent projects</h2>
          <p className={`mx-auto mt-4 max-w-[52ch] text-center ${LEAD}`}>
            A few brands we&apos;ve helped grow, and the numbers that moved.
          </p>
        </div>
        <div className="mt-12">
          <ProjectsMarquee />
        </div>
      </section>

      {/* ══════════════════════════════════════════
          4. ALL SERVICES (where growth usually stalls)
      ══════════════════════════════════════════ */}
      <section id="insights" className="scroll-mt-4 bg-paper py-20 lg:py-28">
        <div className={WRAP}>
          {/* heading on top: title left, intro + CTA right */}
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end lg:gap-20">
            <h2 className={`${H2} max-w-[18ch]`}>
              Where growth usually stalls, and what we do about it
            </h2>
            <div>
              <p className={`max-w-[46ch] ${LEAD}`}>
                Wasted ad spend, slow builds, invisible rankings. We&apos;ve fixed
                each of these before, and a free audit shows you how we&apos;d fix
                yours.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
                <button type="button" onClick={() => openAuditPopup()} className={BTN_INK}>
                  Book a free audit
                </button>
                <span className="text-sm text-slate">500+ businesses have made the switch.</span>
              </div>
            </div>
          </div>

          <div id="all-services" className="mt-14 scroll-mt-24">
            <ServicesGrid />
          </div>
        </div>
      </section>

    </>
  );
}
