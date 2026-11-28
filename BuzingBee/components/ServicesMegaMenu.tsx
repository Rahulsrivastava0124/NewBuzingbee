"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import {
  FaBullhorn,
  FaClapperboard,
  FaFilePen,
  FaBullseye,
  FaEnvelopeCircleCheck,
  FaChartSimple,
  FaRobot,
  FaCircleCheck,
} from "react-icons/fa6";
import type { ComponentType, CSSProperties } from "react";
import { SiGoogleads, SiMeta, SiShopify } from "react-icons/si";
import { SERVICES } from "@/components/ServicesGrid";
import { openAuditPopup } from "@/lib/audit-popup";

// services with their own landing page link there; the rest open the audit popup
const PAGES: Record<string, string> = {
  "Performance Marketing": "/services/performance-marketing",
  "Conversion-led Storefronts": "/services/shopify-development",
  "Systems & Automation": "/services/ai-automation",
};

// one coloured, filled icon per service, matched by title
type IconComp = ComponentType<{ className?: string; style?: CSSProperties; "aria-hidden"?: boolean | "true" }>;
const ICONS: Record<string, { icon: IconComp; color: string }> = {
  "Performance Marketing": { icon: FaBullhorn, color: "#6d3df2" },
  "Creative Strategy & Production": { icon: FaClapperboard, color: "#e0349a" },
  "Copywriting & Messaging": { icon: FaFilePen, color: "#f97316" },
  "Conversion Rate Optimisation": { icon: FaBullseye, color: "#ef4444" },
  "Email, Retention & Loyalty": { icon: FaEnvelopeCircleCheck, color: "#0ea5e9" },
  "Conversion-led Storefronts": { icon: SiShopify, color: "#95bf47" },
  "Data & Attribution": { icon: FaChartSimple, color: "#22c55e" },
  "Systems & Automation": { icon: FaRobot, color: "#4f46e5" },
};

type Props = {
  onNavigate: () => void;
};

/**
 * Full-width dropdown under the navbar: two columns of services (coloured icon
 * tile, name, short tags) and a free growth audit card on the right.
 * Picking a service opens the free-audit popup pre-filled with it.
 */
export default function ServicesMegaMenu({ onNavigate }: Props) {
  return (
    <div className="mx-auto grid max-w-[1280px] items-start gap-8 px-6 py-8 lg:grid-cols-[1fr_400px] lg:px-12">
      <div>
        <ul className="grid grid-cols-2 gap-x-6 gap-y-1">
          {SERVICES.map((svc) => {
            const meta = ICONS[svc.title] ?? { icon: FaBullhorn, color: "#fdb905" };
            const Icon = meta.icon;
            const page = PAGES[svc.title];
            const itemClass =
              "group flex w-full items-center gap-4 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-ink/[0.04] focus-visible:bg-ink/[0.04] focus-visible:outline-none";
            const content = (
              <>
                  <span
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border transition-transform duration-200 group-hover:scale-105"
                    style={{
                      borderColor: `${meta.color}26`,
                      background: `linear-gradient(145deg, ${meta.color}0d, ${meta.color}24)`,
                    }}
                  >
                    <Icon className="h-6 w-6" style={{ color: meta.color }} aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[15px] font-semibold text-ink">{svc.title}</span>
                    <span className="block truncate text-[13px] text-slate">{svc.tags.join(" · ")}</span>
                  </span>
              </>
            );
            return (
              <li key={svc.title}>
                {page ? (
                  <Link href={page} onClick={onNavigate} className={itemClass}>
                    {content}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      onNavigate();
                      openAuditPopup(svc.title);
                    }}
                    className={itemClass}
                  >
                    {content}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* promo card: copy on the left, a small drawn growth dashboard on the right */}
      <div className="relative hidden overflow-hidden rounded-3xl border border-ink/10 bg-[linear-gradient(135deg,#fff8e1_0%,#fdf4ff_55%,#ede9fe_100%)] p-6 shadow-[0_10px_30px_rgba(18,20,28,0.06)] dark:bg-[linear-gradient(135deg,#2a2412_0%,#211a33_60%,#1d1838_100%)] lg:block">
        <AuditArt />
        <div className="relative max-w-[215px]">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fdb905]/25 px-3 py-1 text-[12px] font-semibold text-ink">
            <FaBullseye className="h-3.5 w-3.5 text-[#ef4444]" aria-hidden="true" />
            Free Growth Audit
          </span>
          <p className="mt-3 text-[26px] font-semibold leading-[1.1] tracking-[-0.02em] text-ink">
            Get a Free
            <span className="block text-[#7c3aed] dark:text-[#a78bfa]">Growth Audit</span>
          </p>
          <ul className="mt-4 space-y-1.5 text-[13px] text-ink">
            {["Website & Funnel Review", "Marketing Performance", "Conversion Opportunities"].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <FaCircleCheck className="h-4 w-4 shrink-0 text-[#fdb905]" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <button
          type="button"
          onClick={() => {
            onNavigate();
            openAuditPopup();
          }}
          className="group relative mt-5 inline-flex items-center gap-2 rounded-xl bg-[#fdb905] px-5 py-3 text-[14px] font-semibold text-[#12141c] shadow-[0_6px_16px_rgba(253,185,5,0.35)] transition-colors hover:bg-[#f0ad00] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
        >
          Get Free Audit
          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
}

const BRANDS = [
  { icon: SiGoogleads, color: "#4285f4", tilt: "-rotate-6", pos: "left-0 top-0" },
  { icon: SiMeta, color: "#0866ff", tilt: "rotate-3", pos: "left-[62px] -top-3" },
  { icon: SiShopify, color: "#95bf47", tilt: "rotate-6", pos: "left-[124px] top-1" },
];
const BARS = [18, 30, 42, 58, 78];

/** Decorative: ad-platform tiles floating over a tilted mini dashboard with a rising chart. */
function AuditArt() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute right-4 top-10 h-[250px] w-[170px]">
      {BRANDS.map(({ icon: Icon, color, tilt, pos }) => (
        <span
          key={color}
          className={`absolute z-10 flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-[0_8px_20px_rgba(109,61,242,0.18)] dark:bg-[#2a2440] ${tilt} ${pos}`}
        >
          <Icon className="h-6 w-6" style={{ color }} />
        </span>
      ))}
      <div className="absolute left-2 top-[70px] w-[160px] rotate-[4deg] rounded-2xl border border-[#6d3df2]/15 bg-white p-3 shadow-[0_14px_30px_rgba(109,61,242,0.22)] dark:bg-[#221c38]">
        <div className="mb-3 flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-[#ef4444]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[#fdb905]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" />
          <span className="ml-1 h-1.5 flex-1 rounded-full bg-[#6d3df2]/25" />
        </div>
        <div className="relative flex h-[88px] items-end gap-1.5 rounded-lg bg-[#6d3df2]/[0.05] px-2 pb-2">
          {BARS.map((h) => (
            <span
              key={h}
              className="flex-1 rounded-t bg-gradient-to-t from-[#6d3df2] to-[#a78bfa]"
              style={{ height: `${h}px` }}
            />
          ))}
          <svg viewBox="0 0 100 60" className="absolute inset-x-2 top-1 h-[60px] w-[calc(100%-16px)]" fill="none">
            <path d="M2 52 L28 38 L46 44 L70 22 L94 6" stroke="#9b3ff0" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M84 5 L95 5 L93 16" stroke="#9b3ff0" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <span className="h-6 w-6 rounded-full border-[5px] border-[#fdb905] border-r-[#e0349a] border-b-[#a78bfa]" />
          <span className="flex-1 space-y-1">
            <span className="block h-1.5 w-full rounded-full bg-[#6d3df2]/20" />
            <span className="block h-1.5 w-2/3 rounded-full bg-[#6d3df2]/15" />
          </span>
        </div>
      </div>
    </div>
  );
}
