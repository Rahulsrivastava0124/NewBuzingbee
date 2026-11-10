"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import {
  Activity,
  Check,
  ClipboardList,
  Gauge,
  Lock,
  Monitor,
  Rocket,
  Search,
  Smartphone,
  Tablet,
  Users,
  type LucideIcon,
} from "lucide-react";
import GrowthStairs from "@/components/GrowthStairs";

/*
  Hero right-side stories, one every SCENE_MS:
  1. growth stairs  2. audit → plan → execution  3. develop → test → manage
  Scenes 2 and 3 size everything in `em`, and the stage font-size follows the
  container width (cqw), so the whole scene scales like an image.
*/
const SCENE_MS = 9000;

const ease = "easeOut" as const;
const pop = (delay: number) => ({
  initial: { opacity: 0, scale: 0.6 },
  animate: { opacity: 1, scale: 1 },
  transition: { delay, type: "spring" as const, stiffness: 320, damping: 18 },
});
const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.5, ease },
});
const grow = (delay: number, duration = 0.7) => ({
  initial: { scaleX: 0 },
  animate: { scaleX: 1 },
  transition: { delay, duration, ease },
});

function CheckDot({ delay }: { delay: number }) {
  return (
    <motion.span
      {...pop(delay)}
      className="flex h-[1.15em] w-[1.15em] shrink-0 items-center justify-center rounded-full bg-[#22c55e]"
    >
      <Check className="h-[0.7em] w-[0.7em] text-white" strokeWidth={4} />
    </motion.span>
  );
}

function StepCard({
  step,
  title,
  sub,
  icon: Icon,
  delay,
  className,
  children,
}: {
  step: string;
  title: string;
  sub: string;
  icon: LucideIcon;
  delay: number;
  className: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      {...fadeUp(delay)}
      className={`absolute rounded-[1.1em] border border-[#fdb905]/30 bg-white/95 p-[0.9em] shadow-[0_1em_2.2em_rgba(18,20,28,0.10)] ${className}`}
    >
      <div className="flex items-center gap-[0.6em]">
        <span className="flex h-[2.2em] w-[2.2em] items-center justify-center rounded-[0.7em] bg-[#fdb905]/20">
          <Icon className="h-[1.2em] w-[1.2em] text-[#d98a00]" />
        </span>
        <div className="leading-tight">
          <p className="text-[0.62em] font-bold tracking-[0.15em] text-[#12141c]/45">
            STEP {step}
          </p>
          <p className="font-extrabold text-[#12141c]">{title}</p>
        </div>
        <span className="ml-auto text-[0.68em] font-medium text-[#12141c]/50">{sub}</span>
      </div>
      <div className="mt-[0.8em]">{children}</div>
    </motion.div>
  );
}

/* ── Scene 2: Audit → Plan → Execution ── */
const AUDIT = [
  { label: "Website SEO", value: 62, color: "#fdb905" },
  { label: "Page Speed", value: 48, color: "#9b3ff0" },
  { label: "Ad Accounts", value: 74, color: "#22c55e" },
];
const PLAN = [
  { label: "Research", when: "Week 1" },
  { label: "Strategy", when: "Week 2" },
  { label: "Roadmap", when: "Week 3" },
];

function AuditPlanScene() {
  return (
    <div className="relative h-full w-full">
      <svg viewBox="0 0 640 580" className="absolute inset-0 h-full w-full" aria-hidden="true">
        {[
          { d: "M 362 93 C 450 93, 480 140, 480 200", at: 2.3 },
          { d: "M 265 273 C 190 273, 192 320, 192 375", at: 4.5 },
        ].map((c) => (
          <g key={c.d}>
            <motion.path
              d={c.d}
              fill="none"
              stroke="#fdb905"
              strokeWidth="3"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: c.at, duration: 0.6, ease }}
            />
          </g>
        ))}
      </svg>

      <StepCard step="01" title="Audit" sub="Where you stand" icon={Search} delay={0.2} className="left-[2%] top-[3%] w-[54%]">
        <div className="flex items-center gap-[0.9em]">
          <div className="relative h-[4.6em] w-[4.6em] shrink-0">
            <svg viewBox="0 0 48 48" className="h-full w-full -rotate-90">
              <circle cx="24" cy="24" r="20" fill="none" stroke="#12141c" strokeOpacity="0.08" strokeWidth="5" />
              <motion.circle
                cx="24"
                cy="24"
                r="20"
                fill="none"
                stroke="#fdb905"
                strokeWidth="5"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 0.87 }}
                transition={{ delay: 0.8, duration: 1.4, ease }}
              />
            </svg>
            <motion.span
              {...fadeUp(1.9)}
              className="absolute inset-0 flex flex-col items-center justify-center"
            >
              <span className="text-[1.15em] font-extrabold leading-none text-[#12141c]">87</span>
              <span className="text-[0.5em] font-semibold text-[#12141c]/50">SCORE</span>
            </motion.span>
          </div>
          <div className="flex-1 space-y-[0.55em]">
            {AUDIT.map((r, i) => (
              <div key={r.label} className="flex items-center gap-[0.5em]">
                <span className="w-[7.4em] text-[0.68em] font-semibold text-[#12141c]">{r.label}</span>
                <span className="h-[0.42em] flex-1 overflow-hidden rounded-full bg-[#12141c]/[0.08]">
                  <motion.span
                    {...grow(0.7 + i * 0.4)}
                    className="block h-full rounded-full"
                    style={{ width: `${r.value}%`, background: r.color, originX: 0 }}
                  />
                </span>
                <CheckDot delay={1.4 + i * 0.4} />
              </div>
            ))}
          </div>
        </div>
      </StepCard>

      <StepCard step="02" title="Plan" sub="Custom roadmap" icon={ClipboardList} delay={2.9} className="right-[0%] top-[36%] w-[54%]">
        <div className="relative px-[0.3em]">
          <div className="absolute left-[1em] right-[1em] top-[0.55em] h-[0.25em] rounded-full bg-[#12141c]/[0.08]" />
          <motion.div
            {...grow(3.3, 1.2)}
            style={{ originX: 0 }}
            className="absolute left-[1em] right-[1em] top-[0.55em] h-[0.25em] rounded-full bg-gradient-to-r from-[#fdb905] to-[#f59e0b]"
          />
          <div className="relative flex justify-between">
            {PLAN.map((m, i) => (
              <div key={m.label} className="flex flex-col items-center">
                <motion.span
                  className="h-[1.35em] w-[1.35em] rounded-full border-[0.2em] border-[#fdb905]"
                  initial={{ backgroundColor: "#ffffff" }}
                  animate={{ backgroundColor: "#fdb905" }}
                  transition={{ delay: 3.3 + i * 0.55, duration: 0.3 }}
                />
                <span className="mt-[0.4em] text-[0.72em] font-bold text-[#12141c]">{m.label}</span>
                <span className="text-[0.6em] text-[#12141c]/50">{m.when}</span>
              </div>
            ))}
          </div>
        </div>
      </StepCard>

      <StepCard step="03" title="Execution" sub="Launch & scale" icon={Rocket} delay={5.1} className="left-[4%] top-[66%] w-[54%]">
        <div className="flex justify-between text-[0.68em] font-semibold text-[#12141c]">
          <span>Campaign rollout</span>
          <motion.span {...fadeUp(6.6)}>100%</motion.span>
        </div>
        <div className="mt-[0.35em] h-[0.5em] overflow-hidden rounded-full bg-[#12141c]/[0.08]">
          <motion.div
            {...grow(5.5, 1.2)}
            style={{ originX: 0 }}
            className="h-full rounded-full bg-gradient-to-r from-[#6d3df2] via-[#9b3ff0] to-[#e0349a]"
          />
        </div>
        <div className="mt-[0.7em] flex h-[2.6em] items-end gap-[0.35em]">
          {[35, 50, 42, 65, 78, 100].map((h, i) => (
            <motion.span
              key={i}
              className="flex-1 rounded-t-[0.3em] bg-[#fdb905]"
              style={{ height: `${h}%`, originY: 1 }}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: 5.7 + i * 0.12, duration: 0.4, ease }}
            />
          ))}
          <motion.span
            {...pop(6.9)}
            className="ml-[0.5em] inline-flex items-center gap-[0.35em] self-center whitespace-nowrap rounded-full bg-[#22c55e]/15 px-[0.7em] py-[0.3em] text-[0.68em] font-bold text-[#15803d]"
          >
            <span className="h-[0.5em] w-[0.5em] animate-pulse rounded-full bg-[#22c55e]" />
            Campaign Live
          </motion.span>
        </div>
      </StepCard>
    </div>
  );
}

/* ── Scene 3: Develop → Test → Manage ── */
const PHASES = [
  { label: "Develop", at: 0.2 },
  { label: "Test", at: 3.0 },
  { label: "Manage", at: 5.8 },
];
const CODE = [
  { w: 62, c: "#c084fc", ind: 0 },
  { w: 48, c: "#fdb905", ind: 1 },
  { w: 70, c: "#60a5fa", ind: 2 },
  { w: 40, c: "#4ade80", ind: 2 },
  { w: 58, c: "#f472b6", ind: 1 },
  { w: 66, c: "#60a5fa", ind: 2 },
  { w: 30, c: "#c084fc", ind: 0 },
];
const TESTS = [
  { label: "Responsive layout", value: "Pass" },
  { label: "Page speed", value: "98" },
  { label: "SEO audit", value: "100" },
  { label: "Security & SSL", value: "A+" },
];

function WebDevScene() {
  return (
    <div className="relative h-full w-full">
      {/* phase stepper */}
      <div className="absolute left-0 right-0 top-[1%] flex items-center justify-center gap-[0.5em]">
        {PHASES.map((p, i) => (
          <div key={p.label} className="flex items-center gap-[0.5em]">
            {i > 0 && <span className="h-[0.15em] w-[1.6em] rounded-full bg-[#12141c]/15" />}
            <motion.span
              className="inline-flex items-center gap-[0.4em] rounded-full border-[0.12em] px-[0.9em] py-[0.35em] text-[0.8em] font-bold text-[#12141c]"
              initial={{ backgroundColor: "#ffffff", borderColor: "rgba(18,20,28,0.15)" }}
              animate={{ backgroundColor: "#fdb905", borderColor: "#fdb905" }}
              transition={{ delay: p.at, duration: 0.3 }}
            >
              {i + 1}. {p.label}
            </motion.span>
          </div>
        ))}
      </div>

      {/* browser */}
      <motion.div
        {...fadeUp(0.1)}
        className="absolute bottom-[3%] left-[2%] right-[2%] top-[11%] overflow-hidden rounded-[1.1em] border border-[#12141c]/10 bg-white shadow-[0_1.2em_2.6em_rgba(18,20,28,0.12)]"
      >
        <div className="flex h-[2.4em] items-center gap-[0.4em] border-b border-[#12141c]/[0.08] bg-[#fafafa] px-[0.9em]">
          {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
            <span key={c} className="h-[0.65em] w-[0.65em] rounded-full" style={{ background: c }} />
          ))}
          <span className="mx-auto inline-flex items-center gap-[0.4em] rounded-full bg-white px-[1em] py-[0.25em] text-[0.68em] text-[#12141c]/60 ring-1 ring-[#12141c]/[0.08]">
            <Lock className="h-[0.9em] w-[0.9em]" /> yourbrand.com
          </span>
        </div>

        <div className="relative h-[calc(100%-2.4em)]">
          {/* develop */}
          <motion.div
            className="absolute inset-0 flex gap-[0.8em] p-[0.9em]"
            animate={{ opacity: [1, 1, 0] }}
            transition={{ duration: 2.9, times: [0, 0.9, 1] }}
          >
            <div className="w-[42%] space-y-[0.6em] rounded-[0.8em] bg-[#12141c] p-[0.9em]">
              <p className="text-[0.6em] font-semibold text-white/45">index.tsx</p>
              {CODE.map((l, i) => (
                <motion.span
                  key={i}
                  {...grow(0.4 + i * 0.25, 0.35)}
                  className="block h-[0.45em] rounded-full"
                  style={{ width: `${l.w}%`, marginLeft: `${l.ind * 0.9}em`, background: l.c, originX: 0 }}
                />
              ))}
            </div>
            <div className="flex-1 space-y-[0.6em]">
              <motion.div {...fadeUp(0.6)} className="flex items-center gap-[0.4em]">
                <span className="h-[0.9em] w-[2.6em] rounded-full bg-[#fdb905]" />
                <span className="ml-auto h-[0.4em] w-[1.6em] rounded-full bg-[#12141c]/15" />
                <span className="h-[0.4em] w-[1.6em] rounded-full bg-[#12141c]/15" />
                <span className="h-[0.4em] w-[1.6em] rounded-full bg-[#12141c]/15" />
              </motion.div>
              <motion.div
                {...fadeUp(1.1)}
                className="space-y-[0.45em] rounded-[0.8em] bg-gradient-to-br from-[#fff3cc] to-[#ffe27a] p-[0.9em]"
              >
                <span className="block h-[0.6em] w-[80%] rounded-full bg-[#12141c]/80" />
                <span className="block h-[0.6em] w-[55%] rounded-full bg-[#12141c]/80" />
                <span className="block h-[0.35em] w-[70%] rounded-full bg-[#12141c]/25" />
                <span className="mt-[0.6em] block h-[1.2em] w-[4.4em] rounded-full bg-[#12141c]" />
              </motion.div>
              <div className="grid grid-cols-3 gap-[0.5em]">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    {...fadeUp(1.6 + i * 0.2)}
                    className="space-y-[0.35em] rounded-[0.6em] border border-[#12141c]/[0.08] p-[0.5em]"
                  >
                    <span className="block h-[1.6em] rounded-[0.4em] bg-[#fdb905]/25" />
                    <span className="block h-[0.3em] w-[80%] rounded-full bg-[#12141c]/20" />
                    <span className="block h-[0.3em] w-[55%] rounded-full bg-[#12141c]/15" />
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* test */}
          <motion.div
            className="absolute inset-0 space-y-[0.7em] p-[0.9em]"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 1, 0] }}
            transition={{ delay: 2.8, duration: 3, times: [0, 0.1, 0.9, 1] }}
          >
            <div className="flex gap-[0.6em]">
              {[Monitor, Tablet, Smartphone].map((Icon, i) => (
                <motion.div
                  key={i}
                  className="flex flex-1 items-center justify-center gap-[0.4em] rounded-[0.8em] border-[0.12em] py-[0.7em]"
                  initial={{ borderColor: "rgba(18,20,28,0.10)" }}
                  animate={{ borderColor: "#fdb905" }}
                  transition={{ delay: 3.2 + i * 0.3 }}
                >
                  <Icon className="h-[1.4em] w-[1.4em] text-[#12141c]" />
                  <CheckDot delay={3.3 + i * 0.3} />
                </motion.div>
              ))}
            </div>
            {TESTS.map((row, i) => (
              <motion.div
                key={row.label}
                {...fadeUp(3.4 + i * 0.4)}
                className="flex items-center gap-[0.6em] rounded-[0.7em] bg-[#12141c]/[0.03] px-[0.8em] py-[0.55em]"
              >
                <span className="text-[0.8em] font-semibold text-[#12141c]">{row.label}</span>
                <span className="ml-auto text-[0.8em] font-extrabold text-[#12141c]">{row.value}</span>
                <CheckDot delay={3.6 + i * 0.4} />
              </motion.div>
            ))}
            <motion.div
              {...pop(5.2)}
              className="mx-auto w-fit rounded-full bg-[#22c55e]/15 px-[1em] py-[0.35em] text-[0.8em] font-bold text-[#15803d]"
            >
              All tests passed
            </motion.div>
          </motion.div>

          {/* manage */}
          <motion.div
            className="absolute inset-0 space-y-[0.7em] p-[0.9em]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 5.7, duration: 0.4 }}
          >
            <div className="grid grid-cols-3 gap-[0.6em]">
              {[
                { icon: Activity, label: "Uptime", value: "99.9%" },
                { icon: Users, label: "Visitors", value: "+62%" },
                { icon: Gauge, label: "Load time", value: "0.8s" },
              ].map((s, i) => (
                <motion.div
                  key={s.label}
                  {...fadeUp(5.9 + i * 0.2)}
                  className="rounded-[0.8em] border border-[#fdb905]/30 bg-[#fffbeb] p-[0.6em]"
                >
                  <s.icon className="h-[1.1em] w-[1.1em] text-[#d98a00]" />
                  <p className="mt-[0.3em] text-[0.62em] font-medium text-[#12141c]/55">{s.label}</p>
                  <p className="text-[1em] font-extrabold text-[#12141c]">{s.value}</p>
                </motion.div>
              ))}
            </div>
            <motion.div
              {...fadeUp(6.3)}
              className="rounded-[0.8em] border border-[#12141c]/[0.08] p-[0.7em]"
            >
              <p className="text-[0.68em] font-semibold text-[#12141c]/60">Monthly traffic</p>
              <svg viewBox="0 0 300 90" className="mt-[0.3em] h-[9em] w-full" preserveAspectRatio="none">
                <motion.path
                  d="M 0 78 L 40 70 L 80 74 L 120 55 L 160 60 L 200 38 L 240 30 L 300 8"
                  fill="none"
                  stroke="#9b3ff0"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 6.5, duration: 1.3, ease }}
                />
              </svg>
            </motion.div>
            <div className="flex flex-wrap gap-[0.5em]">
              {["Auto backups", "Security updates", "24/7 monitoring"].map((chip, i) => (
                <motion.span
                  key={chip}
                  {...fadeUp(7.6 + i * 0.2)}
                  className="inline-flex items-center gap-[0.4em] rounded-full bg-[#12141c]/[0.04] px-[0.7em] py-[0.35em] text-[0.7em] font-semibold text-[#12141c]"
                >
                  <Check className="h-[1em] w-[1em] text-[#22c55e]" strokeWidth={3} />
                  {chip}
                </motion.span>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

const SCENES = [
  { label: "Growth", Scene: GrowthStairs },
  { label: "Audit · Plan · Execute", Scene: AuditPlanScene },
  { label: "Develop · Test · Manage", Scene: WebDevScene },
];

export default function HeroStories() {
  const [active, setActive] = useState(0);

  // re-armed on every change, so a tab click restarts the full timer
  useEffect(() => {
    const id = setTimeout(() => setActive((i) => (i + 1) % SCENES.length), SCENE_MS);
    return () => clearTimeout(id);
  }, [active]);

  const { Scene } = SCENES[active];

  return (
    <MotionConfig reducedMotion="user">
      <div className="mx-auto w-full max-w-[640px] font-jakarta [container-type:inline-size]">
        <div className="relative aspect-[640/580] [font-size:clamp(9px,2.5cqw,16px)]">
          <div className="absolute left-1/2 top-1/2 h-[90%] w-[90%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(253,185,5,0.22),transparent_65%)]" />
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
            >
              <Scene />
            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </MotionConfig>
  );
}
