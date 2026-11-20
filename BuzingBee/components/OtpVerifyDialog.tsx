"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle, Loader2, ShieldCheck, X } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.buzingbee.com/api";
const SEND_URL = `${API_BASE}/enquiries/otp/send`;
const VERIFY_URL = `${API_BASE}/enquiries/otp/verify`;

// What /enquiries/submit returns when the lead can be verified
export type EnquiryVerification = {
  required: boolean;
  phone?: string;
  enquiryToken?: string;
};

type Props = {
  verification: EnquiryVerification | null;
  // called when the visitor closes the dialog; true when the phone was verified
  onClose: (verified: boolean) => void;
};

const postJson = async (url: string, body: Record<string, string>) => {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) {
    const err = new Error(json.message || "Something went wrong. Please try again.") as Error & {
      retryAfter?: number;
    };
    err.retryAfter = Number(json.retryAfter) || 0;
    throw err;
  }
  return json;
};

// Second step after an enquiry is saved: WhatsApp OTP marks the lead as verified.
// Skipping keeps the lead, unverified.
export default function OtpVerifyDialog({ verification, onClose }: Props) {
  const open = Boolean(verification?.required && verification.enquiryToken);
  const token = verification?.enquiryToken || "";
  const phone = verification?.phone || "";

  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [sent, setSent] = useState("");
  const [error, setError] = useState("");
  const [verified, setVerified] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const sendCode = useCallback(async () => {
    if (!token) return;
    setError("");
    setSending(true);
    try {
      const json = await postJson(SEND_URL, { enquiryToken: token });
      if (json.alreadyVerified) {
        setVerified(true);
        return;
      }
      setSent(json.message || `OTP sent successfully to your WhatsApp (+91 ${phone}).`);
      setCooldown(Number(json.resendAfterSeconds) || 60);
      inputRef.current?.focus();
    } catch (err) {
      const e = err as Error & { retryAfter?: number };
      if (e.retryAfter) setCooldown(e.retryAfter);
      setError(e.message || "Could not send the code.");
    } finally {
      setSending(false);
    }
  }, [token, phone]);

  // a new enquiry opens the dialog: reset and send the first code
  useEffect(() => {
    if (!open) return;
    setCode("");
    setSent("");
    setError("");
    setVerified(false);
    setCooldown(0);
    sendCode();
  }, [open, token, sendCode]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const verifyCode = async () => {
    setError("");
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6-digit code.");
      return;
    }
    setVerifying(true);
    try {
      await postJson(VERIFY_URL, { enquiryToken: token, code });
      setVerified(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not verify the code.");
    } finally {
      setVerifying(false);
    }
  };

  if (!open) return null;

  const close = () => onClose(verified);
  const btn =
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="otp-dialog-title"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-textMuted transition-colors hover:border-accent hover:text-accent"
        >
          <X className="h-5 w-5" />
        </button>

        {verified ? (
          <div className="py-4 text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <h3 id="otp-dialog-title" className="mt-3 text-xl font-bold text-textHeading font-heading">
              Number verified
            </h3>
            <p className="mt-2 text-sm text-textMuted">
              Thank you! Your enquiry is confirmed. We&apos;ll get back to you within 24 hours.
            </p>
            <button type="button" onClick={close} className={`btn-primary mt-5 w-full ${btn}`}>
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 pr-8">
              <ShieldCheck className="h-6 w-6 text-accent" />
              <h3 id="otp-dialog-title" className="text-xl font-bold text-textHeading font-heading">
                Verify your WhatsApp number
              </h3>
            </div>
            <p className="mt-2 text-sm text-textMuted">
              Your enquiry is saved. Enter the 6-digit code we sent to{" "}
              <span className="font-semibold text-textHeading">+91 {phone}</span> so we can confirm it&apos;s you.
            </p>

            {sending && !sent && (
              <p className="mt-4 flex items-center gap-2 text-sm text-textMuted">
                <Loader2 className="h-4 w-4 animate-spin" /> Sending code…
              </p>
            )}

            {sent && (
              <p
                role="status"
                className="mt-4 flex items-start gap-2 rounded-xl border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-400"
              >
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{sent} It may take up to a minute to arrive.</span>
              </p>
            )}

            <label htmlFor="otp-code" className="sr-only">
              6-digit code
            </label>
            <input
              id="otp-code"
              ref={inputRef}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  verifyCode();
                }
              }}
              placeholder="Enter 6-digit code"
              className="mt-4 w-full rounded-xl border border-border bg-bgPrimary px-4 py-3 text-center text-lg tracking-[0.4em] text-textHeading placeholder:tracking-normal placeholder:text-sm placeholder:text-textMuted outline-none focus:border-accent"
            />

            {error && (
              <p role="alert" className="mt-2 text-sm text-red-500">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={verifyCode}
              disabled={verifying || code.length !== 6}
              className={`btn-primary mt-4 w-full ${btn}`}
            >
              {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
            </button>

            <div className="mt-3 flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={sendCode}
                disabled={sending || cooldown > 0}
                className="font-medium text-accent hover:underline disabled:cursor-not-allowed disabled:text-textMuted disabled:no-underline"
              >
                {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
              </button>
              <button type="button" onClick={close} className="text-textMuted hover:text-textHeading">
                Skip for now
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
