// Cloudflare Turnstile verification for public forms.
// Enabled only when TURNSTILE_SECRET_KEY is set, so existing deployments keep
// working until the key (and the matching site key on the website) is added.
const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

const isTurnstileEnabled = () => Boolean(process.env.TURNSTILE_SECRET_KEY);

// Returns { ok: true } or { ok: false, status, message }.
const verifyTurnstile = async (token, remoteIp) => {
  if (!isTurnstileEnabled()) return { ok: true };

  if (typeof token !== "string" || !token.trim() || token.length > 2048) {
    return {
      ok: false,
      status: 400,
      message: "Please complete the human verification and try again.",
    };
  }

  try {
    const body = new URLSearchParams({
      secret: process.env.TURNSTILE_SECRET_KEY,
      response: token,
    });
    if (remoteIp) body.set("remoteip", remoteIp);

    const response = await fetch(VERIFY_URL, {
      method: "POST",
      body,
      signal: AbortSignal.timeout(8000),
    });
    const result = await response.json();

    if (result.success) return { ok: true };
    return {
      ok: false,
      status: 400,
      message: "Verification failed. Please refresh the page and try again.",
    };
  } catch (_error) {
    // Fail closed: if Cloudflare cannot be reached we cannot prove it's a human
    return {
      ok: false,
      status: 503,
      message: "Verification is temporarily unavailable. Please try again shortly.",
    };
  }
};

module.exports = { isTurnstileEnabled, verifyTurnstile };
