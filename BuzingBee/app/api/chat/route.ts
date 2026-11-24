import { NextRequest, NextResponse } from "next/server";

const FALLBACK_MESSAGE =
  "Oops! Something went wrong. Please try again or visit buzingbee.com/contact 🐝";

const EMPTY_WEBHOOK_RESPONSE_MESSAGE =
  "Thanks! I received your message. Please share a little more detail, and Bee will help right away. 🐝";

const MAX_MESSAGE_CHARS = 1000;
const WEBHOOK_TIMEOUT_MS = 25_000;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 20; // messages per visitor IP per window

// ponytail: in-memory, per server process; move to a shared store (Redis) if the
// site ever runs on more than one instance
const recent = new Map<string, number[]>();
const isRateLimited = (ip: string) => {
  const now = Date.now();
  const hits = (recent.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  hits.push(now);
  recent.set(ip, hits);
  if (recent.size > 5000) recent.clear(); // bound memory under a flood
  return hits.length > RATE_MAX;
};

const extractReplyText = (payload: unknown): string | null => {
  if (typeof payload === "string") {
    return payload.trim() || null;
  }

  if (Array.isArray(payload)) {
    for (const item of payload) {
      const match = extractReplyText(item);
      if (match) return match;
    }
    return null;
  }

  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;
  const directKeys = [
    "reply",
    "message",
    "text",
    "response",
    "output",
    "answer",
  ];

  for (const key of directKeys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  const nestedKeys = ["data", "result", "body"];

  for (const key of nestedKeys) {
    const match = extractReplyText(record[key]);
    if (match) return match;
  }

  return null;
};

export async function POST(request: NextRequest) {
  const webhookUrl = process.env.N8N_WEBHOOK_URL?.trim();

  if (!webhookUrl) {
    console.error("[API /chat] Missing N8N_WEBHOOK_URL env variable.");
    return NextResponse.json(
      { error: "Chat webhook is not configured.", reply: FALLBACK_MESSAGE },
      { status: 500 },
    );
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      {
        error: "Too many messages.",
        reply: "You're sending messages quickly! Please wait a few minutes, or reach us at buzingbee.com/contact 🐝",
      },
      { status: 429 },
    );
  }

  try {
    const body = (await request.json()) as {
      message?: unknown;
      sessionId?: unknown;
    };

    const message = typeof body.message === "string" ? body.message.trim() : "";
    const sessionId =
      typeof body.sessionId === "string" && body.sessionId.trim()
        ? body.sessionId.trim().slice(0, 100)
        : null;

    if (message.length > MAX_MESSAGE_CHARS) {
      return NextResponse.json(
        {
          error: "Message is too long.",
          reply: `Please keep your message under ${MAX_MESSAGE_CHARS} characters. 🐝`,
        },
        { status: 400 },
      );
    }

    if (!message) {
      return NextResponse.json(
        { error: "Message is required.", reply: FALLBACK_MESSAGE },
        { status: 400 },
      );
    }

    const webhookResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        sessionId,
        source: "buzingbee-chat-widget",
      }),
      cache: "no-store",
      // A stuck webhook must not hold the request (and the visitor) open
      signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
    });

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      console.error("[API /chat] Webhook request failed:", {
        status: webhookResponse.status,
        body: errorText,
      });

      return NextResponse.json(
        { error: "Webhook request failed.", reply: FALLBACK_MESSAGE },
        { status: 502 },
      );
    }

    const contentType = webhookResponse.headers.get("content-type") || "";
    const rawText = (await webhookResponse.text()).trim();

    if (!rawText) {
      return NextResponse.json(
        { reply: EMPTY_WEBHOOK_RESPONSE_MESSAGE },
        { status: 200 },
      );
    }

    if (contentType.includes("application/json")) {
      try {
        const payload = JSON.parse(rawText) as unknown;
        const reply = extractReplyText(payload) || rawText || FALLBACK_MESSAGE;
        return NextResponse.json({ reply }, { status: 200 });
      } catch {
        return NextResponse.json(
          { reply: rawText || FALLBACK_MESSAGE },
          { status: 200 },
        );
      }
    }

    return NextResponse.json({ reply: rawText }, { status: 200 });
  } catch (error) {
    console.error("[API /chat] Unexpected error:", error);
    return NextResponse.json(
      { error: "Unexpected chat error.", reply: FALLBACK_MESSAGE },
      { status: 500 },
    );
  }
}
