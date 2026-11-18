"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";

export interface ArticleHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

interface ArticleSidebarProps {
  headings: ArticleHeading[];
  minutes: number;
  /** id of the element wrapping the article body; progress is measured over it */
  articleId: string;
}

// a heading counts as reached once it scrolls under the fixed navbar
const OFFSET = 120;

// Reading progress for one article, from the scroll position:
// - progress: share of the article body scrolled past (0–1)
// - active: index of the section being read (-1 before the first heading)
function useReadingProgress(articleId: string, headings: ArticleHeading[]) {
  const [state, setState] = useState({ progress: 0, active: -1 });

  useEffect(() => {
    const update = () => {
      const article = document.getElementById(articleId);
      if (!article) return;
      const rect = article.getBoundingClientRect();
      const span = rect.height - window.innerHeight + OFFSET;
      const progress =
        span <= 0 ? (rect.top < OFFSET ? 1 : 0) : Math.min(1, Math.max(0, (OFFSET - rect.top) / span));
      let active = -1;
      headings.forEach((h, i) => {
        const el = document.getElementById(h.id);
        if (el && el.getBoundingClientRect().top <= OFFSET + 10) active = i;
      });
      setState((prev) =>
        prev.progress === progress && prev.active === active ? prev : { progress, active },
      );
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [articleId, headings]);

  return state;
}

// Top-of-page bar on every screen size, plus (on large screens) a sticky panel listing
// the article's points: read ones are ticked, the current one is highlighted.
export default function ArticleSidebar({ headings, minutes, articleId }: ArticleSidebarProps) {
  const { progress, active } = useReadingProgress(articleId, headings);
  const percent = Math.round(progress * 100);
  const done = percent >= 100;
  const minutesLeft = Math.max(1, Math.ceil(minutes * (1 - progress)));

  // Long lists scroll inside the panel: keep the current point in view (without moving the page)
  const listRef = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const list = listRef.current;
    const item = list?.children[active] as HTMLElement | undefined;
    if (!list || !item) return;
    const above = item.offsetTop < list.scrollTop;
    const below = item.offsetTop + item.offsetHeight > list.scrollTop + list.clientHeight;
    if (above || below) list.scrollTop = item.offsetTop - list.clientHeight / 3;
  }, [active]);

  return (
    <>
      <div
        className="fixed inset-x-0 top-0 z-[60] h-1 bg-transparent"
        role="progressbar"
        aria-label="Reading progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
      >
        <div
          className="h-full origin-left bg-honey transition-transform duration-150 ease-out"
          style={{ transform: `scaleX(${progress})` }}
        />
      </div>

      <aside className="hidden lg:block">
        <div className="sticky top-28 rounded-2xl border border-ink/10 bg-surface p-6">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-sm font-semibold text-ink">{done ? "Finished reading" : "Reading progress"}</p>
            <p className="text-sm tabular-nums text-slate">{percent}%</p>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink/10">
            <div
              className="h-full rounded-full bg-honey transition-[width] duration-150 ease-out"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-slate">
            {done ? "Thanks for reading." : `About ${minutesLeft} min left`}
          </p>

          {headings.length > 0 && (
            <nav aria-label="In this article" className="mt-6 border-t border-ink/10 pt-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate">In this article</p>
              <ol ref={listRef} className="relative mt-3 max-h-[55vh] space-y-1 overflow-y-auto pr-1">
                {headings.map((h, i) => {
                  const read = i < active || (done && i <= active);
                  const current = i === active && !done;
                  return (
                    <li key={h.id} className={h.level === 3 ? "pl-6" : undefined}>
                      <a
                        href={`#${h.id}`}
                        aria-current={current ? "location" : undefined}
                        className={`flex items-start gap-2.5 rounded-lg px-2 py-1.5 text-sm leading-snug transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-honey ${
                          current ? "bg-comb font-medium text-ink" : read ? "text-slate" : "text-slate hover:text-ink"
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                            read
                              ? "border-honey bg-honey text-[#12141c]"
                              : current
                                ? "border-ink"
                                : "border-ink/20"
                          }`}
                        >
                          {read && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
                        </span>
                        <span>{h.text}</span>
                        {read && <span className="sr-only">(read)</span>}
                      </a>
                    </li>
                  );
                })}
              </ol>
            </nav>
          )}
        </div>
      </aside>
    </>
  );
}
