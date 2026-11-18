"use client";

import { useMemo, useState } from "react";
import {
  Check,
  Copy,
  Facebook,
  Linkedin,
  MessageCircle,
  Send,
  Share2,
} from "lucide-react";

interface BlogShareButtonsProps {
  title: string;
  url: string;
}

const iconClassName = "w-4 h-4";

export default function BlogShareButtons({
  title,
  url,
}: BlogShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const canUseNativeShare =
    typeof navigator !== "undefined" && "share" in navigator;

  const encodedUrl = useMemo(() => encodeURIComponent(url), [url]);
  const encodedTitle = useMemo(() => encodeURIComponent(title), [title]);

  const shareLinks = useMemo(
    () => [
      {
        href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
        label: "Facebook",
        icon: Facebook,
      },
      {
        href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
        label: "LinkedIn",
        icon: Linkedin,
      },
      {
        href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
        label: "Telegram",
        icon: Send,
      },
      {
        href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
        label: "WhatsApp",
        icon: MessageCircle,
      },
    ],
    [encodedTitle, encodedUrl],
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleNativeShare = async () => {
    if (!canUseNativeShare) return;

    try {
      await navigator.share({
        title,
        url,
      });
    } catch {
      return;
    }
  };

  return (
    <div className="mt-10 rounded-[18px] border border-border bg-card p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-textHeading">
            Share this article
          </p>
          <p className="mt-1 text-sm text-textMuted">
            Send this post to your team or share it on social media.
          </p>
        </div>

        {canUseNativeShare ? (
          <button
            type="button"
            onClick={handleNativeShare}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-2 text-sm font-semibold text-accent transition-all duration-300 hover:bg-accent hover:text-bgPrimary"
          >
            <Share2 className={iconClassName} />
            Share
          </button>
        ) : null}
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        {shareLinks.map(({ href, label, icon: Icon }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Share on ${label}`}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-bgSection px-4 py-2 text-sm font-medium text-textBody transition-all duration-300 hover:border-accent/40 hover:text-accent"
          >
            <Icon className={iconClassName} />
            {label}
          </a>
        ))}

        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-bgSection px-4 py-2 text-sm font-medium text-textBody transition-all duration-300 hover:border-accent/40 hover:text-accent"
        >
          {copied ? (
            <Check className={iconClassName} />
          ) : (
            <Copy className={iconClassName} />
          )}
          {copied ? "Copied" : "Copy Link"}
        </button>
      </div>
    </div>
  );
}
