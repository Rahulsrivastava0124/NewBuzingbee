"use client";

import { ArrowRight } from "lucide-react";
import { openAuditPopup } from "@/lib/audit-popup";

export const SERVICES = [
  {
    title: "Performance Marketing",
    tags: ["Paid media", "Meta & Google"],
    desc: "Full-funnel media buying engineered around data, psychology and buying intent, judged on profit, not clicks.",
  },
  {
    title: "Creative Strategy & Production",
    tags: ["Hooks", "Scripts", "UGC"],
    desc: "Research-led angles and scroll-stopping creatives that speak your audience's language, and sell.",
  },
  {
    title: "Copywriting & Messaging",
    tags: ["Ads", "Pages", "Offers"],
    desc: "Words that turn browsers into buyers before the price ever matters, from the first ad to the last email.",
  },
  {
    title: "Conversion Rate Optimisation",
    tags: ["Audits", "Offers", "A/B tests"],
    desc: "Because traffic means nothing if it doesn't convert. We find the leaks and test our way to more revenue.",
  },
  {
    title: "Email, Retention & Loyalty",
    tags: ["Email", "WhatsApp", "Loyalty"],
    desc: "Lifecycle journeys that make customers come back again and again, and lift lifetime value every month.",
  },
  {
    title: "Conversion-led Storefronts",
    tags: ["Shopify", "Headless", "WordPress"],
    desc: "Commerce experiences where brand, speed and conversion are engineered in from the first wireframe.",
  },
  {
    title: "Data & Attribution",
    tags: ["Server-side", "Dashboards"],
    desc: "One source of truth for every rupee, so scaling decisions are backed by real purchases.",
  },
  {
    title: "Systems & Automation",
    tags: ["Integrations", "Platforms", "AI"],
    desc: "Custom platforms and automations that let you scale revenue without scaling headcount.",
  },
];

// 8 services in a hairline grid (1 → 2 → 4 columns). The 1px lines come from the
// container's ink/10 background showing through a 1px gap between opaque cells.
// Hover / keyboard focus: cell tints, arrow appears, honey bar grows along the bottom.
// Clicking a cell opens the free-audit popup for that service.
export default function ServicesGrid() {
  return (
    <ul className="grid gap-px border border-ink/10 bg-ink/10 sm:grid-cols-2 lg:grid-cols-4">
      {SERVICES.map((s, i) => (
        <li key={s.title} className="bg-paper">
          {/* opens the free-audit popup, pre-filled with this service */}
          <button
            type="button"
            onClick={() => openAuditPopup(s.title)}
            className="group relative flex h-full min-h-[22rem] w-full flex-col p-7 text-left transition-colors duration-300 hover:bg-comb focus-visible:bg-comb focus-visible:outline-none xl:p-9"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs tracking-[0.15em] text-slate">S{i + 1}</span>
              <ArrowRight
                aria-hidden="true"
                className="h-5 w-5 -translate-x-2 text-[#6d3df2] opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100"
              />
            </div>

            <h3 className="mt-14 text-[26px] font-medium leading-[1.25] tracking-[-0.01em] text-ink xl:text-[28px]">
              {s.title}
            </h3>
            {/* each tag stays whole when the line wraps */}
            <p className="mt-4 flex flex-wrap gap-x-2.5 gap-y-1 font-mono text-[12px] uppercase tracking-[0.16em] text-ink/75">
              {s.tags.map((tag, t) => (
                <span key={tag} className="whitespace-nowrap">
                  {t > 0 && <span aria-hidden="true" className="mr-2.5">·</span>}
                  {tag}
                </span>
              ))}
            </p>
            <p className="mt-6 text-base leading-relaxed text-slate">{s.desc}</p>

            <span
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 bg-[#fdb905] transition-transform duration-500 ease-out group-hover:scale-x-100 group-focus-visible:scale-x-100"
            />
          </button>
        </li>
      ))}
    </ul>
  );
}
