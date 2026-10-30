"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Sends one page view per route to the admin panel's Traffic & Leads.
// The API counts a visitor once per page per hour, so re-renders are harmless.
const TRACK_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.buzingbee.com/api"}/analytics/track`;

const deviceType = () => {
  const ua = navigator.userAgent;
  if (/iPad|Tablet/i.test(ua)) return "tablet";
  if (/Mobi|Android|iPhone/i.test(ua)) return "mobile";
  return "desktop";
};

export default function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Local development would pollute the live numbers
    if (process.env.NODE_ENV !== "production" || !pathname) return;
    fetch(TRACK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ website: "buzingbee", page: pathname, device: deviceType() }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  return null;
}
