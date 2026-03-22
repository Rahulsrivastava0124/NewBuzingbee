import { NextRequest, NextResponse } from "next/server";

const FALLBACK_MESSAGE =
  "Oops! Something went wrong. Please try again or visit buzingbee.com/contact 🐝";

const EMPTY_WEBHOOK_RESPONSE_MESSAGE =
  "Thanks! I received your message. Please share a little more detail, and Bee will help right away. 🐝";

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

  try {
    const body = (await request.json()) as {
      message?: unknown;
      sessionId?: unknown;
    };

    const message = typeof body.message === "string" ? body.message.trim() : "";
    const sessionId =
      typeof body.sessionId === "string" && body.sessionId.trim()
        ? body.sessionId.trim()
        : null;

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
