"use client";

import { useEffect, useState } from "react";
import { Check, Facebook, Link2, Linkedin, MessageCircle, Send, Share2 } from "lucide-react";

interface BlogShareButtonsProps {
  title: string;
  url: string;
}

// Icon-only share row: each button names its network for screen readers and on hover.
// Each network gets a soft tint of its brand colour, filling solid (white icon) on hover.
const ICON_BTN =
  "inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-200 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-honey focus-visible:ring-offset-2 focus-visible:ring-offset-paper";
// copy link / more options: honey tint, ink icon (text on honey stays ink)
const NEUTRAL_BTN = `${ICON_BTN} bg-honey/20 text-[#12141c] dark:text-honey hover:bg-honey hover:!text-[#12141c]`;

export default function BlogShareButtons({ title, url }: BlogShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  // navigator.share only exists in the browser; checked after mount to avoid a hydration mismatch
  const [canShare, setCanShare] = useState(false);
  useEffect(() => setCanShare("share" in navigator), []);

  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  const links = [
    // brand colours (logo colours, not part of the site palette)
    {
      href: `https://wa.me/?text=${t}%20${u}`,
      label: "WhatsApp",
      icon: MessageCircle,
      color: "bg-[#25d366]/15 text-[#128c4b] dark:text-[#25d366] hover:bg-[#25d366]",
    },
    {
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
      label: "LinkedIn",
      icon: Linkedin,
      color: "bg-[#0a66c2]/15 text-[#0a66c2] dark:text-[#4c9ee8] hover:bg-[#0a66c2]",
    },
    {
      href: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
      label: "Facebook",
      icon: Facebook,
      color: "bg-[#1877f2]/15 text-[#1877f2] dark:text-[#5a9df5] hover:bg-[#1877f2]",
    },
    {
      href: `https://t.me/share/url?url=${u}&text=${t}`,
      label: "Telegram",
      icon: Send,
      color: "bg-[#229ed9]/15 text-[#1a7fb0] dark:text-[#4cb8ea] hover:bg-[#229ed9]",
    },
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
      {links.map(({ href, label, icon: Icon, color }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Share on ${label}`}
          title={`Share on ${label}`}
          className={`${ICON_BTN} ${color}`}
        >
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </a>
      ))}
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? "Link copied" : "Copy link"}
        title={copied ? "Link copied" : "Copy link"}
        className={NEUTRAL_BTN}
      >
        {copied ? <Check className="h-4 w-4" strokeWidth={2.25} /> : <Link2 className="h-4 w-4" strokeWidth={1.75} />}
      </button>
      {canShare && (
        <button
          type="button"
          onClick={() => navigator.share({ title, url }).catch(() => {})}
          aria-label="More sharing options"
          title="More sharing options"
          className={NEUTRAL_BTN}
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
