"use client";

import { FormEvent, useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle,
  XCircle,
  TrendingUp,
  Bot,
  MapPin,
  Globe,
  Megaphone,
  Search,
  Code2,
  Brain,
  Target,
  Star,
  Zap,
  ChevronRight,
  Mail,
  Phone,
  MessageSquare,
} from "lucide-react";
import AnimatedCounter from "@/components/AnimatedCounter";
import SectionHeading from "@/components/SectionHeading";
import TestimonialCard from "@/components/TestimonialCard";
import GridBackground from "@/components/GridBackground";
import {
  stats,
  serviceCategories,
  testimonials,
  processSteps,
  blogPosts,
} from "@/lib/data";
import { CiPhone } from "react-icons/ci";

/* ── helpers ── */
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.12 },
  }),
};

const TRUST_LOGOS = [
  "Google Partner",
  "Meta Business",
  "Shopify Expert",
  "HubSpot Agency",
  "AWS Partner",
  "Semrush Agency",
  "Clutch Top Agency",
  "GoodFirms",
];

const PROBLEMS = [
  {
    icon: "📉",
    pain: "Burning ad budget with no clear ROI or attribution",
    fix: "Data-driven PPC with automated bidding — every rupee tracked, no waste.",
    tag: "Advertising",
  },
  {
    icon: "🐌",
    pain: "Dev agency took months, cost a fortune, and missed the brief",
    fix: "Agile builds delivered in weeks at 40–60% lower cost — fixed scope, no surprises.",
    tag: "Development",
  },
  {
    icon: "🔍",
    pain: "Invisible on Google despite publishing content regularly",
    fix: "AI-powered SEO + GEO that targets real buyer intent and AI overview rankings.",
    tag: "SEO / GEO",
  },
  {
    icon: "💸",
    pain: "Paying multiple agencies for siloed work that doesn't compound",
    fix: "One integrated team for ads, SEO, dev & AI — strategy that stacks and scales.",
    tag: "Cost Efficiency",
  },
  {
    icon: "🤖",
    pain: "Losing leads at 2 AM because there's no one to respond",
    fix: "Conversational AI chatbots that qualify, nurture and book calls 24/7 automatically.",
    tag: "AI Automation",
  },
  {
    icon: "📱",
    pain: "App or website that's slow, outdated, and kills conversions",
    fix: "Performance-first web & app builds — fast, beautiful, and built to convert.",
    tag: "Development",
  },
];

const PILLAR_ICONS: Record<string, React.ElementType> = {
  "digital-marketing": Megaphone,
  "web-app-development": Code2,
  advertising: Target,
  "ai-services": Brain,
  "geo-services": MapPin,
};

const RESULTS = [
  {
    metric: "+300%",
    label: "Lead Generation",
    sub: "SaaS brand, 90 days",
    img: "/assets/image/objective_pic_1.jpg",
  },
  {
    metric: "+400%",
    label: "Organic Traffic",
    sub: "E-commerce store, 6 months",
    img: "/assets/image/objective_pic_2.jpg",
  },
  {
    metric: "3×",
    label: "Revenue Growth",
    sub: "D2C brand via Meta & Google Ads",
    img: "/assets/image/portfolio_1.jpg",
  },
  {
    metric: "−60%",
    label: "Support Tickets",
    sub: "AI chatbot deployment",
    img: "/assets/image/portfolio_2.jpg",
  },
];

const AI_EDGE = [
  {
    icon: <Brain className="w-7 h-7 text-accent" />,
    title: "Predictive Analytics",
    desc: "We forecast campaign performance before you spend a single rupee, using ML models trained on your niche.",
  },
  {
    icon: <Search className="w-7 h-7 text-accent" />,
    title: "AI-Powered SEO & GEO",
    desc: "Rank in Google's AI Overviews and LLM recommendations, not just the blue links.",
  },
  {
    icon: <Bot className="w-7 h-7 text-accent" />,
    title: "Conversational AI",
    desc: "24/7 AI chatbots that qualify leads, book calls, and personalise the buyer journey automatically.",
  },
  {
    icon: <Zap className="w-7 h-7 text-accent" />,
    title: "Automated Bidding",
    desc: "Real-time bid adjustments across Google & Meta Ads for maximum ROI with zero manual overhead.",
  },
];

type HomeBlogPost = {
  id: string | number;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  image: string;
  slug: string;
};

const ENQUIRY_API_URL = process.env.NEXT_PUBLIC_API_BASE_URL
  ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/enquiries/submit`
  : "https://api.buzingbee.com/api/enquiries/submit";

export default function HomePage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    service: "",
    budget: "",
    message: "",
  });
  const [leadSubmitState, setLeadSubmitState] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [leadSubmitMessage, setLeadSubmitMessage] = useState("");
  const [blogSectionPosts, setBlogSectionPosts] =
    useState<HomeBlogPost[]>(blogPosts);

  const handleLeadSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setLeadSubmitState("submitting");
    setLeadSubmitMessage("");

    try {
      const response = await fetch(ENQUIRY_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, source: "home-cta" }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.message || "Failed to submit enquiry");
      }

      setLeadSubmitState("success");
      setLeadSubmitMessage(
        payload?.message || "Thank you! We will connect with you shortly.",
      );
      setForm({
        name: "",
        email: "",
        phone: "",
        service: "",
        budget: "",
        message: "",
      });
    } catch (error) {
      setLeadSubmitState("error");
      setLeadSubmitMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
      );
    }
  };

  useEffect(() => {
    let active = true;

    const loadBlogs = async () => {
      try {
        const response = await fetch("/api/blog", { cache: "no-store" });
        if (!response.ok) return;

        const payload = (await response.json()) as { posts?: HomeBlogPost[] };
        if (!active) return;

        if (Array.isArray(payload.posts) && payload.posts.length > 0) {
          setBlogSectionPosts(payload.posts);
        }
      } catch {
        // keep fallback posts from local data
      }
    };

    void loadBlogs();

    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      {/* ══════════════════════════════════════════
          1. HERO SECTION
      ══════════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-24 pb-16">
        {/* ── Background layer z-0 — all purely decorative ── */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <GridBackground />
          {/* Persistent non-circular background glow */}
          <div className="absolute inset-x-0 top-0 h-[68%] bg-gradient-to-b from-accent/[0.16] via-accent/[0.08] to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-[40%] bg-gradient-to-t from-accent/[0.08] to-transparent" />
          <div className="absolute left-[-20%] top-[12%] w-[60%] h-[52%] bg-gradient-to-r from-accent/[0.10] to-transparent blur-[80px]" />
          <div className="absolute right-[-20%] bottom-[10%] w-[55%] h-[48%] bg-gradient-to-l from-accent/[0.08] to-transparent blur-[80px]" />

          {/* Slow moving highlight strip */}
          <motion.div
            animate={{ x: ["-8%", "8%", "-8%"], opacity: [0.2, 0.35, 0.2] }}
            transition={{ repeat: Infinity, duration: 16, ease: "easeInOut" }}
            className="absolute left-0 right-0 top-[36%] mx-auto h-24 w-[78%] bg-gradient-to-r from-transparent via-accent/[0.20] to-transparent blur-2xl"
          />
          {/* Floating dots */}
          {[
            { top: "15%", left: "8%", size: 5, dur: 5.5, delay: 0 },
            { top: "72%", left: "6%", size: 3, dur: 7, delay: 1 },
            { top: "22%", left: "88%", size: 4, dur: 6.5, delay: 0.5 },
            { top: "65%", left: "85%", size: 5, dur: 8, delay: 2 },
            { top: "45%", left: "4%", size: 3, dur: 6, delay: 1.5 },
            { top: "80%", left: "50%", size: 3, dur: 9, delay: 0.8 },
            { top: "10%", left: "55%", size: 4, dur: 7.5, delay: 2.5 },
            { top: "55%", left: "78%", size: 3, dur: 5, delay: 0.3 },
          ].map((p, i) => (
            <motion.div
              key={i}
              animate={{ y: [0, -14, 0], opacity: [0.12, 0.35, 0.12] }}
              transition={{
                repeat: Infinity,
                duration: p.dur,
                ease: "easeInOut",
                delay: p.delay,
              }}
              className="absolute rounded-full bg-accent"
              style={{
                top: p.top,
                left: p.left,
                width: p.size,
                height: p.size,
              }}
            />
          ))}
          {/* Dot grid */}
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage:
                "radial-gradient(circle, currentColor 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
        </div>

        {/* ── Content — always above bg ── */}
        <div className="container-max relative z-20 px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center max-w-4xl mx-auto">
          {/* ── Animated badge ── */}
          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-7"
          >
            <span className="inline-flex items-center gap-2 bg-[#1f1b12]/40 text-white text-sm font-semibold px-5 py-2 rounded-full border border-[#FACC15]/35 shadow-sm">
              <Zap className="w-4 h-4" />
              AI-First Development Agency
            </span>
          </motion.div>

          {/* ── Headline ── */}
          <motion.h1
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.1 }}
            className="text-4xl sm:text-6xl md:text-7xl font-bold font-heading text-textHeading leading-[1.08] tracking-tight"
          >
            Build Faster with{" "}
            <span className="relative inline-block">
              <span className="text-[#FACC15]">AI-Powered</span>
              <svg
                className="absolute -bottom-2 left-0 w-full"
                viewBox="0 0 300 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M2 9 Q75 2 150 7 Q225 12 298 5"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  className="text-[#FACC15]"
                />
              </svg>
            </span>{" "}
            Development
          </motion.h1>

          {/* ── Sub-headline ── */}
          <motion.p
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.22 }}
            className="mt-8 text-base md:text-lg text-textBody max-w-2xl leading-relaxed"
          >
            BuzingBee delivers AI-powered web and app development that is
            cost-effective, faster to launch, and built for real business growth
            — without agency delays or inflated budgets.
          </motion.p>

          {/* ── Trust signals row ── */}
          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.34 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm"
          >
            {/* Star rating */}
            <div className="flex items-center gap-1.5 bg-card border border-border rounded-full px-4 py-1.5 shadow-sm font-numeric">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className="w-3.5 h-3.5 fill-[#C28A00] text-[#C28A00]"
                />
              ))}
              <span className="ml-1 font-semibold text-textHeading">5.0</span>
              <span className="text-textMuted">· 200+ reviews</span>
            </div>
            <div className="h-5 w-px bg-border hidden sm:block" />
            {/* Avatar stack + clients count */}
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {["#E08A2A", "#3B82F6", "#10B981", "#F59E0B"].map(
                  (color, i) => (
                    <div
                      key={i}
                      className="w-7 h-7 rounded-full border-2 border-bg flex items-center justify-center text-[10px] font-bold text-white"
                      style={{ backgroundColor: color }}
                    >
                      {["R", "S", "A", "P"][i]}
                    </div>
                  ),
                )}
              </div>
              <span className="text-textBody text-sm font-numeric">
                <span className="font-semibold text-textHeading">500+</span>{" "}
                happy clients
              </span>
            </div>
            <div className="h-5 w-px bg-border hidden sm:block" />
            {/* Certified */}
            <div className="flex items-center gap-1.5 text-textMuted">
              <CheckCircle className="w-4 h-4 text-[#B07D00]" />
              <span>Google & Meta Certified</span>
            </div>
          </motion.div>

          {/* ── CTAs ── */}
          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.46 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/contact"
              className="btn-primary gap-2 px-8 py-3.5 text-base shadow-lg shadow-accent/20 hover:shadow-accent/40 transition-shadow"
            >
              <Phone className="w-5 h-5" /> Get a Free Call
            </Link>
            <Link
              href="/services"
              className="btn-outline gap-2 px-8 py-3.5 text-base text-[#8A6500] border-[#D7B340] hover:bg-[#F8EDC6] hover:text-[#8A6500] transition-colors"
            >
              See Our Services
            </Link>
          </motion.div>

          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.52 }}
            className="mt-6 w-full max-w-3xl"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-textMuted mb-3">
              Explore Popular Pages
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              {[
                { label: "Services", href: "/services" },
                { label: "Pricing", href: "/pricing" },
                { label: "Startup Plans", href: "/startup" },
                { label: "Portfolio", href: "/portfolio" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-xl border border-border bg-card/80 px-3 py-2.5 text-sm font-semibold text-textHeading hover:border-accent/45 hover:text-accent transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </motion.div>

          {/* ── Stats strip ── */}
          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.58 }}
            className="mt-16 w-full grid grid-cols-2 md:grid-cols-4 gap-0 border border-border rounded-2xl overflow-hidden bg-card"
          >
            {stats.map((s, i) => (
              <div
                key={s.label}
                className={`flex flex-col items-center justify-center py-6 px-4 ${
                  i < stats.length - 1 ? "border-r border-border" : ""
                }`}
              >
                <AnimatedCounter
                  value={s.value}
                  suffix={s.suffix}
                  label={s.label}
                />
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          2. TRUST BAR
      ══════════════════════════════════════════ */}
      <section className="relative py-10 border-y border-border overflow-hidden bg-bgSection">
        {/* Fade edges */}
        <div className="pointer-events-none absolute left-0 top-0 h-full w-24 z-10 bg-gradient-to-r from-bgSection to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 h-full w-24 z-10 bg-gradient-to-l from-bgSection to-transparent" />

        <p className="text-center text-xs font-bold uppercase tracking-[0.25em] text-textMuted mb-6">
          Trusted by ambitious businesses worldwide &nbsp;·&nbsp; Certified
          partners
        </p>

        <div className="relative flex overflow-hidden">
          <motion.div
            animate={{ x: ["0%", "-50%"] }}
            transition={{ repeat: Infinity, duration: 26, ease: "linear" }}
            className="flex items-center gap-5 shrink-0 whitespace-nowrap pr-5"
          >
            {[...TRUST_LOGOS, ...TRUST_LOGOS].map((name, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-2.5 bg-card border border-border
                           text-textHeading text-sm font-semibold px-5 py-2.5 rounded-full
                           shadow-sm hover:border-accent/50 hover:text-accent
                           hover:shadow-[0_0_18px_rgba(224,138,42,0.18)]
                           transition-all duration-300 cursor-default select-none"
              >
                {/* Icon dot */}
                <span className="w-2 h-2 rounded-full bg-accent inline-block shrink-0" />
                {name}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          3. PROBLEM & SOLUTION
      ══════════════════════════════════════════ */}
      <section className="section-padding relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-bgSection/40 to-transparent pointer-events-none" />
        <div className="container-max relative z-10">
          {/* Heading */}
          <div className="text-center mb-14">
            <motion.span
              initial={{ opacity: 0, y: -10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 bg-red-500/10 text-red-500 text-xs font-bold px-4 py-1.5 rounded-full border border-red-500/20 mb-4"
            >
              <XCircle className="w-3.5 h-3.5" /> Common Growth Blockers
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-3xl md:text-4xl lg:text-5xl font-bold font-heading text-textHeading leading-tight"
            >
              Ready to Scale Smarter ?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-3 text-textMuted text-base max-w-2xl mx-auto leading-relaxed"
            >
              Whether it's wasted ad spend, costly dev projects, or invisible
              rankings — we've solved it before and we'll solve it for you.
            </motion.p>
          </div>

          {/* Split table layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LEFT — Problems column */}
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="rounded-2xl border border-red-500/20 bg-red-500/[0.03] overflow-hidden"
            >
              {/* Column header */}
              <div className="flex items-center gap-3 px-6 py-4 border-b border-red-500/15 bg-red-500/5">
                <div className="w-7 h-7 rounded-full bg-red-500/15 flex items-center justify-center">
                  <XCircle className="w-4 h-4 text-red-500" />
                </div>
                <span className="text-sm font-bold text-red-500 uppercase tracking-widest">
                  Without BuzingBee
                </span>
              </div>
              <ul className="divide-y divide-red-500/10">
                {PROBLEMS.map((p, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.07 }}
                    className="flex items-start gap-4 px-6 py-4 group"
                  >
                    <span className="text-xl shrink-0 mt-0.5">{p.icon}</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-red-500/60 mb-0.5 block">
                        {p.tag}
                      </span>
                      <p className="text-textHeading text-sm font-medium leading-relaxed">
                        {p.pain}
                      </p>
                    </div>
                    <XCircle className="w-4 h-4 text-red-400/40 shrink-0 mt-1" />
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            {/* RIGHT — Solutions column */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="rounded-2xl border border-accent/25 bg-accent/[0.03] overflow-hidden"
            >
              {/* Column header */}
              <div className="flex items-center gap-3 px-6 py-4 border-b border-accent/15 bg-accent/5">
                <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-accent" />
                </div>
                <span className="text-sm font-bold text-accent uppercase tracking-widest">
                  With BuzingBee
                </span>
              </div>
              <ul className="divide-y divide-accent/10">
                {PROBLEMS.map((p, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: 12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.07 + 0.1 }}
                    className="flex items-start gap-4 px-6 py-4"
                  >
                    <CheckCircle className="w-4 h-4 text-accent shrink-0 mt-1" />
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-accent/60 mb-0.5 block">
                        {p.tag}
                      </span>
                      <p className="text-textBody text-sm leading-relaxed">
                        {p.fix}
                      </p>
                    </div>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* Bottom CTA strip */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 bg-card border border-border rounded-2xl px-6 py-5"
          >
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-accent shrink-0" />
              <span className="text-textBody text-sm">
                <span className="font-bold text-textHeading">
                  500+ businesses
                </span>{" "}
                already made the switch — all seeing measurable ROI within 90
                days.
              </span>
            </div>
            <Link
              href="/contact"
              className="btn-primary gap-2 shrink-0 text-sm px-6 py-2.5"
            >
              Fix My Growth <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          4. SERVICE PILLARS
      ══════════════════════════════════════════ */}
      <section className="section-padding bg-bgSection">
        <div className="container-max">
          <SectionHeading
            title="Our Service"
            subtitle="Five powerful pillars — each designed to compound results when combined."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {serviceCategories.map((cat, i) => {
              const Icon = PILLAR_ICONS[cat.id] || Globe;
              return (
                <motion.div
                  key={cat.id}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={i}
                  className="group bg-card border border-border rounded-2xl p-6 flex flex-col gap-3
                             hover:border-accent/50 hover:shadow-[0_0_30px_rgba(224,138,42,0.12)]
                             transition-all duration-300 cursor-default"
                >
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-1 group-hover:bg-accent/20 transition-colors">
                    <Icon className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="text-base font-bold text-textHeading font-heading leading-snug">
                    {cat.label}
                  </h3>
                  <p className="text-textMuted text-xs leading-relaxed line-clamp-2">
                    {cat.description}
                  </p>
                  <div className="mt-auto flex items-center justify-between gap-3 pt-1">
                    <Link
                      href="/services"
                      className="flex items-center gap-1 text-accent text-xs font-semibold"
                    >
                      Learn more <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                    <Link
                      href={{
                        pathname: "/contact",
                        query: {
                          source: "home-service-card",
                          service: cat.label,
                        },
                      }}
                      className="inline-flex items-center rounded-md bg-accent px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-accentHover transition-colors"
                    >
                      Start
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          5. ALPHA RESULTS — CASE STUDIES
      ══════════════════════════════════════════ */}
      <section className="section-padding">
        <div className="container-max">
          <SectionHeading
            title="Case Studies"
            subtitle="Real numbers from real campaigns. No fluff, just proven performance."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {RESULTS.map((r, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="relative rounded-2xl overflow-hidden border border-border group"
              >
                <img
                  src={r.img}
                  alt={r.label}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 p-5">
                  <p className="text-3xl font-bold text-accent font-heading leading-none">
                    {r.metric}
                  </p>
                  <p className="text-white font-semibold text-base mt-1">
                    {r.label}
                  </p>
                  <p className="text-white/60 text-xs mt-0.5">{r.sub}</p>
                </div>
                <div className="absolute top-3 right-3">
                  <TrendingUp className="w-5 h-5 text-accent" />
                </div>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/portfolio" className="btn-outline gap-2">
              View All Case Studies <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          6. SOCIAL PROOF — TESTIMONIALS
      ══════════════════════════════════════════ */}
      {testimonials.length > 0 && (
        <section className="section-padding bg-bgSection">
          <div className="container-max">
            <SectionHeading
              title="What Our Clients Say"
              subtitle="Authentic results from businesses that trusted BuzingBee to scale their growth."
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {testimonials.map((t, i) => (
                <TestimonialCard
                  key={t.id}
                  name={t.name}
                  company={t.company}
                  avatar={t.avatar}
                  rating={t.rating}
                  text={t.text}
                  index={i}
                />
              ))}
            </div>
            {/* Visual rating strip */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-6 h-6 text-accent fill-accent" />
              ))}
              <span className="text-textHeading font-bold text-lg ml-2">
                5.0
              </span>
              <span className="text-textMuted text-sm">
                · 200+ verified reviews
              </span>
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════
          7. SECRET SAUCE — AI / GEO EDGE
      ══════════════════════════════════════════ */}
      <section className="section-padding relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-transparent" />
        <div className="container-max relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-flex items-center gap-2 bg-accent/10 text-accent text-xs font-semibold px-4 py-1.5 rounded-full mb-4 border border-accent/20">
                <Zap className="w-3.5 h-3.5" /> Our Competitive Edge
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-textHeading font-heading leading-tight mb-6">
                The AI & GEO Advantage Nobody Else Offers
              </h2>
              <p className="text-textBody text-base leading-relaxed mb-8">
                While other agencies chase yesterday's playbook, BuzingBee
                integrates Generative Engine Optimisation and predictive AI to
                keep your brand visible in the era of AI-driven search.
              </p>
              <Link href="/services" className="btn-primary gap-2">
                See How It Works <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {AI_EDGE.map((item, i) => (
                <motion.div
                  key={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={i}
                  className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-3
                             hover:border-accent/40 transition-colors"
                >
                  <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center">
                    {item.icon}
                  </div>
                  <h4 className="font-bold text-textHeading font-heading text-sm">
                    {item.title}
                  </h4>
                  <p className="text-textMuted text-xs leading-relaxed">
                    {item.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          8. HOW WE WORK — PROCESS
      ══════════════════════════════════════════ */}
      <section className="section-padding bg-bgSection">
        <div className="container-max">
          <SectionHeading
            title="Our Proven Process"
            subtitle="A battle-tested four-step approach that delivers consistent, compounding results."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {processSteps.map((step, i) => (
              <motion.div
                key={step.step}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="relative text-center"
              >
                <div className="w-16 h-16 mx-auto rounded-full bg-accent/10 border-2 border-accent flex items-center justify-center mb-5">
                  <span className="text-2xl font-bold text-accent font-heading">
                    {step.step}
                  </span>
                </div>
                {i < processSteps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[calc(50%+40px)] w-[calc(100%-80px)] h-px bg-border" />
                )}
                <h3 className="text-xl font-bold text-textHeading font-heading mb-2">
                  {step.title}
                </h3>
                <p className="text-textMuted text-sm leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          9. BLOG / EXPERT RESOURCES
      ══════════════════════════════════════════ */}
      {blogSectionPosts.length > 0 && (
        <section className="section-padding">
          <div className="container-max">
            <SectionHeading
              title="Blogs"
              subtitle="Thought leadership, growth tactics, and industry trends from the BuzingBee team."
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {blogSectionPosts.slice(0, 3).map((post, i) => (
                <motion.div
                  key={post.id}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={i}
                  className="group bg-card border border-border rounded-2xl overflow-hidden
                             hover:border-borderHover hover:shadow-[0_0_30px_rgba(224,138,42,0.1)]
                             transition-all duration-300"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={post.image || "/assets/image/services1.png"}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "/assets/image/services1.png";
                      }}
                    />
                    <span className="absolute top-3 left-3 bg-accent text-white text-xs font-semibold px-3 py-1 rounded-full">
                      {post.category}
                    </span>
                  </div>
                  <div className="p-5">
                    <p className="text-textMuted text-xs mb-2">{post.date}</p>
                    <h3 className="text-base font-bold text-textHeading font-heading leading-snug mb-2 line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-textMuted text-xs leading-relaxed line-clamp-2 mb-4">
                      {post.excerpt}
                    </p>
                    <Link
                      href={`/blog/${post.slug}`}
                      className="text-accent text-xs font-semibold flex items-center gap-1 hover:gap-2 transition-all"
                    >
                      Read More <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="text-center mt-10">
              <Link href="/blog" className="btn-outline gap-2">
                View All Articles <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════
          10. FINAL CTA + CONTACT FORM
      ══════════════════════════════════════════ */}
      <section
        className="section-padding relative overflow-hidden"
        id="contact"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-accent/10 via-accent/5 to-transparent" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-[120px]" />
        <div className="container-max relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left copy */}
            <div>
              <span className="inline-flex items-center gap-2 bg-accent/10 text-accent text-xs font-semibold px-4 py-1.5 rounded-full mb-5 border border-accent/20">
                <MessageSquare className="w-3.5 h-3.5" /> Free Strategy Call
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-textHeading font-heading leading-tight mb-5">
                Ready to Grow?
                <br />
                <span className="text-accent">Let's Talk.</span>
              </h2>
              <p className="text-textBody text-base leading-relaxed mb-8 max-w-md">
                Book a free 30-minute audit and discover exactly how BuzingBee
                can scale your brand with AI-driven marketing and development.
              </p>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 text-textBody text-sm">
                  <Mail className="w-5 h-5 text-accent shrink-0" />
                  <span>hello@buzingbee.com</span>
                </div>
                <div className="flex items-center gap-3 text-textBody text-sm">
                  <Phone className="w-5 h-5 text-accent shrink-0" />
                  <span>+91 98765 43210</span>
                </div>
              </div>
            </div>

            {/* Right form */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-card border border-border rounded-2xl p-8 shadow-xl"
            >
              <h3 className="text-xl font-bold text-textHeading font-heading mb-6">
                Get Your Free Audit
              </h3>
              <form onSubmit={handleLeadSubmit} className="flex flex-col gap-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Your Name *"
                    value={form.name}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    required
                    className="w-full bg-bgSection border border-border rounded-xl px-4 py-3 text-textHeading text-sm placeholder:text-textMuted outline-none focus:border-accent transition-colors"
                  />
                  <input
                    type="email"
                    placeholder="Your Email *"
                    value={form.email}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, email: e.target.value }))
                    }
                    required
                    className="w-full bg-bgSection border border-border rounded-xl px-4 py-3 text-textHeading text-sm placeholder:text-textMuted outline-none focus:border-accent transition-colors"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    value={form.phone}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    className="w-full bg-bgSection border border-border rounded-xl px-4 py-3 text-textHeading text-sm placeholder:text-textMuted outline-none focus:border-accent transition-colors"
                  />
                  <select
                    value={form.service}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, service: e.target.value }))
                    }
                    className="w-full bg-bgSection border border-border rounded-xl px-4 py-3 text-textHeading text-sm outline-none focus:border-accent transition-colors"
                  >
                    <option value="">Select Service</option>
                    <option value="web-development">Web Development</option>
                    <option value="mobile-app">Mobile App Development</option>
                    <option value="ai-ml">AI & ML Development</option>
                    <option value="seo">SEO Optimization</option>
                    <option value="social-media">Social Media Marketing</option>
                    <option value="ppc">Google & Meta Ads</option>
                    <option value="email-marketing">Email Marketing</option>
                    <option value="branding">Brand Identity & Logo</option>
                    <option value="ecommerce">E-Commerce Solutions</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <select
                  value={form.budget}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, budget: e.target.value }))
                  }
                  className="w-full bg-bgSection border border-border rounded-xl px-4 py-3 text-textHeading text-sm outline-none focus:border-accent transition-colors"
                >
                  <option value="">Select Budget Range</option>
                  <option value="below-5k">Below ₹5,000</option>
                  <option value="5k-10k">₹5,000 — ₹10,000</option>
                  <option value="10k-25k">₹10,000 — ₹25,000</option>
                  <option value="25k-50k">₹25,000 — ₹50,000</option>
                  <option value="50k-1l">₹50,000 — ₹1,00,000</option>
                  <option value="above-1l">Above ₹1,00,000</option>
                </select>

                <textarea
                  placeholder="Tell us about your project *"
                  value={form.message}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, message: e.target.value }))
                  }
                  rows={4}
                  required
                  className="w-full bg-bgSection border border-border rounded-xl px-4 py-3 text-textHeading text-sm placeholder:text-textMuted outline-none focus:border-accent transition-colors resize-none"
                />

                <button
                  type="submit"
                  disabled={leadSubmitState === "submitting"}
                  className="btn-primary w-full gap-2 justify-center disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {leadSubmitState === "submitting"
                    ? "Submitting..."
                    : "Start Your Project"}{" "}
                  <ArrowRight className="w-5 h-5" />
                </button>

                {leadSubmitState === "success" && (
                  <div className="flex items-start gap-2 rounded-xl border border-green-500/35 bg-green-500/10 px-4 py-3 text-sm text-green-700">
                    <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{leadSubmitMessage}</span>
                  </div>
                )}

                {leadSubmitState === "error" && (
                  <div className="flex items-start gap-2 rounded-xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm text-red-600">
                    <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{leadSubmitMessage}</span>
                  </div>
                )}
              </form>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}
