"use client";

import { useEffect, useState } from "react";
import { Eye } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.buzingbee.com/api";
const KEY = "bb_visitor";

// one random id per browser, so each person is counted once per post
function visitorId(): string | null {
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

/** Unique visitor count for a post; registers this browser's visit. */
export default function BlogVisitors({ blogId, initial }: { blogId: string; initial: number }) {
  const [count, setCount] = useState(initial);

  useEffect(() => {
    const visitor = visitorId();
    if (!visitor) return;
    fetch(`${API}/blog/${blogId}/visit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitor }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (typeof d?.uniqueVisitors === "number") setCount(d.uniqueVisitors);
      })
      .catch(() => {});
  }, [blogId]);

  return (
    <span className="inline-flex items-center gap-1.5">
      <Eye className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
      {count.toLocaleString("en-IN")} unique {count === 1 ? "visitor" : "visitors"}
    </span>
  );
}
