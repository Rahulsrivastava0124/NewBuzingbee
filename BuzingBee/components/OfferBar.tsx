"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { openAuditPopup } from "@/lib/audit-popup";

/**
 * Thin dark announcement bar at the very top of the site. It shows one offer at a
 * time and flips (rotates on the X axis) to the next every few seconds.
 * Hovering or focusing the bar pauses the rotation so people can click.
 */

type Offer = {
  tag: string;
  title: string;
  note: string;
  cta: string;
  href?: string;
  /** open the "Get Free Audit" popup instead of following a link */
  audit?: boolean;
};

const OFFERS: Offer[] = [
  {
    tag: "Startup Plan",
    title: "Startup offer",
    note: "Starter plans for new businesses",
    cta: "View plans",
    href: "/startup",
  },
  {
    tag: "Free",
    title: "Free website & SEO audit",
    note: "Find what's holding your growth back",
    cta: "Get free audit",
    audit: true,
  },
  {
    tag: "Free",
    title: "Free 1:1 consultation",
    note: "Talk to an expert about your goals",
    cta: "Book a call",
    href: "/contact",
  },
];

const INTERVAL_MS = 3500;

const CTA_CLASS =
  "inline-flex shrink-0 items-center gap-1 rounded-full bg-white px-3 py-1 text-[12px] font-semibold text-[#0b0d14] transition-colors hover:bg-honey focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-honey sm:px-4 sm:text-[13px]";

export default function OfferBar() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % OFFERS.length), INTERVAL_MS);
    return () => clearInterval(id);
  }, [paused]);

  const offer = OFFERS[index];

  return (
    <div
      className="relative h-9 overflow-hidden bg-[#0b0d14] text-white [perspective:600px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      aria-live="polite"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={index}
          initial={reduceMotion ? { opacity: 0 } : { rotateX: -90, opacity: 0 }}
          animate={reduceMotion ? { opacity: 1 } : { rotateX: 0, opacity: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { rotateX: 90, opacity: 0 }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
          style={{ transformOrigin: "50% 50% -18px", backfaceVisibility: "hidden" }}
          className="absolute inset-0 flex items-center justify-center gap-3 px-4 text-[13px] sm:gap-4 sm:text-sm"
        >
          <span className="h-2 w-2 shrink-0 rounded-full bg-honey" aria-hidden="true" />
          <span className="truncate font-semibold">{offer.title}</span>
          <span className="hidden rounded-md border border-dashed border-emerald-400/60 px-2 py-0.5 text-[12px] font-semibold uppercase tracking-wide text-emerald-300 md:inline">
            {offer.tag}
          </span>
          <span className="hidden truncate text-white/60 lg:inline">{offer.note}</span>
          {offer.audit ? (
            <button type="button" onClick={() => openAuditPopup()} className={CTA_CLASS}>
              {offer.cta}
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          ) : (
            <Link href={offer.href ?? "/"} className={CTA_CLASS}>
              {offer.cta}
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
