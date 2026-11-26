"use client";

import Link from "next/link";
import {
  TrendingUp,
  Clapperboard,
  PenLine,
  Target,
  Mail,
  ShoppingBag,
  BarChart3,
  Bot,
  ArrowUpRight,
  type LucideIcon,
} from "lucide-react";
import { SERVICES } from "@/components/ServicesGrid";
import { openAuditPopup } from "@/lib/audit-popup";

// one coloured icon per service, matched by title
const ICONS: Record<string, { icon: LucideIcon; color: string }> = {
  "Performance Marketing": { icon: TrendingUp, color: "#6d3df2" },
  "Creative Strategy & Production": { icon: Clapperboard, color: "#e0349a" },
  "Copywriting & Messaging": { icon: PenLine, color: "#f97316" },
  "Conversion Rate Optimisation": { icon: Target, color: "#ef4444" },
  "Email, Retention & Loyalty": { icon: Mail, color: "#0ea5e9" },
  "Conversion-led Storefronts": { icon: ShoppingBag, color: "#16a34a" },
  "Data & Attribution": { icon: BarChart3, color: "#0d9488" },
  "Systems & Automation": { icon: Bot, color: "#4f46e5" },
};

type Props = {
  /** where "View all services" goes */
  allHref: string;
  onNavigate: () => void;
};

/**
 * Full-width dropdown under the navbar: two columns of services (coloured icon
 * tile, name, short tags) and a free-audit promo card on the right.
 * Picking a service opens the free-audit popup pre-filled with it.
 */
export default function ServicesMegaMenu({ allHref, onNavigate }: Props) {
  return (
    <div className="mx-auto grid max-w-[1200px] gap-8 px-6 py-8 lg:grid-cols-[1fr_320px] lg:px-12">
      <div>
        <p className="mb-4 px-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-slate">
          Services
        </p>
        <ul className="grid grid-cols-2 gap-x-6 gap-y-1">
          {SERVICES.map((svc) => {
            const meta = ICONS[svc.title] ?? { icon: TrendingUp, color: "#fdb905" };
            const Icon = meta.icon;
            return (
              <li key={svc.title}>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate();
                    openAuditPopup(svc.title);
                  }}
                  className="group flex w-full items-center gap-4 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-ink/[0.04] focus-visible:bg-ink/[0.04] focus-visible:outline-none"
                >
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-ink/10 bg-surface transition-transform duration-200 group-hover:scale-105"
                    style={{ backgroundColor: `${meta.color}0f` }}
                  >
                    <Icon className="h-5 w-5" style={{ color: meta.color }} aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[15px] font-medium text-ink">{svc.title}</span>
                    <span className="block truncate text-[13px] text-slate">{svc.tags.join(" · ")}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <Link
          href={allHref}
          onClick={onNavigate}
          className="ml-3 mt-4 inline-flex items-center gap-1 text-[14px] font-semibold text-ink underline decoration-[#fdb905] decoration-2 underline-offset-[6px] hover:decoration-ink"
        >
          View all services
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      {/* promo card */}
      <button
        type="button"
        onClick={() => {
          onNavigate();
          openAuditPopup();
        }}
        className="group hidden self-start rounded-2xl border border-ink/10 bg-surface p-1.5 text-left lg:block"
      >
        <span className="flex h-44 items-center justify-center rounded-xl bg-[linear-gradient(180deg,#b45309_0%,#f59e0b_45%,#fdb905_70%,#fef3c7_100%)] text-[26px] font-semibold text-white transition-transform duration-300 group-hover:scale-[1.02]">
          Free Audit
        </span>
        <span className="flex items-center justify-between px-2.5 pb-1.5 pt-3 text-[14px] text-ink">
          Get a free growth audit
          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </span>
      </button>
    </div>
  );
}
