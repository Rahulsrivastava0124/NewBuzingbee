"use client";

import { useEffect, useState } from "react";
import { Check, Facebook, Link2, Linkedin, MessageCircle, Send, Share2 } from "lucide-react";

interface BlogShareButtonsProps {
  title: string;
  url: string;
}

// Icon-only share row: each button names its network for screen readers and on hover
const ICON_BTN =
  "inline-flex h-10 w-10 items-center justify-center rounded-full border border-ink/10 bg-surface text-slate transition-colors duration-200 hover:border-ink/25 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-honey";

export default function BlogShareButtons({ title, url }: BlogShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  // navigator.share only exists in the browser; checked after mount to avoid a hydration mismatch
  const [canShare, setCanShare] = useState(false);
  useEffect(() => setCanShare("share" in navigator), []);

  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  const links = [
    { href: `https://wa.me/?text=${t}%20${u}`, label: "WhatsApp", icon: MessageCircle },
    { href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`, label: "LinkedIn", icon: Linkedin },
    { href: `https://www.facebook.com/sharer/sharer.php?u=${u}`, label: "Facebook", icon: Facebook },
    { href: `https://t.me/share/url?url=${u}&text=${t}`, label: "Telegram", icon: Send },
  ];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {links.map(({ href, label, icon: Icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Share on ${label}`}
          title={`Share on ${label}`}
          className={ICON_BTN}
        >
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </a>
      ))}
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? "Link copied" : "Copy link"}
        title={copied ? "Link copied" : "Copy link"}
        className={ICON_BTN}
      >
        {copied ? <Check className="h-4 w-4 text-green-600" /> : <Link2 className="h-4 w-4" strokeWidth={1.75} />}
      </button>
      {canShare && (
        <button
          type="button"
          onClick={() => navigator.share({ title, url }).catch(() => {})}
          aria-label="More sharing options"
          title="More sharing options"
          className={ICON_BTN}
        >
          <Share2 className="h-4 w-4" strokeWidth={1.75} />
        </button>
      )}
      <span className="sr-only" aria-live="polite">
        {copied ? "Link copied" : ""}
      </span>
    </div>
  );
}
