"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { CardSpotlight } from "@/components/ui/card-spotlight";

// spotlight: honey in light mode, violet in dark (--spot in globals.css), white + ink dots at medium strength, so the
// animation shows while the ink text on top stays readable
const DOTS = [
  [255, 255, 255],
  [255, 255, 255],
  [18, 20, 28],
];
const DOT_OPACITIES = [0.25, 0.25, 0.25, 0.35, 0.35, 0.35, 0.5, 0.5, 0.5, 0.65];

// Homepage service item: a honey spotlight follows the pointer (or centres on keyboard
// focus) and reveals the dot matrix around it. Text stays ink: white on honey is unreadable.
export default function ServiceRevealCard({
  icon: Icon,
  title,
  desc,
  href,
}: {
  icon: LucideIcon;
  title: string;
  desc: string;
  href: string;
}) {
  return (
    <CardSpotlight
      radius={260}
      color="rgb(var(--spot))"
      dotColors={DOTS}
      dotOpacities={DOT_OPACITIES}
      className="h-full overflow-hidden"
    >
      <Link
        href={href}
        className="relative z-10 block h-full p-6 2xl:p-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink"
      >
        {/* fixed 2-line title row so descriptions line up across each row */}
        <div className="flex min-h-[3.5rem] items-center gap-5">
          <Icon className="h-7 w-7 shrink-0 text-ink" strokeWidth={1.75} />
          <h3 className="text-lg font-semibold leading-snug text-ink">{title}</h3>
        </div>
        <p className="mt-2 pl-12 text-base leading-relaxed text-slate transition-colors duration-200 group-hover/spotlight:text-ink/85">
          {desc}
        </p>
      </Link>
    </CardSpotlight>
  );
}
