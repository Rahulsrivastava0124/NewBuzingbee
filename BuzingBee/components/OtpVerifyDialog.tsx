"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle, Loader2, X } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";

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
  // render as a step inside the caller's own popup instead of an overlay on top of it
  inline?: boolean;
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
export default function OtpVerifyDialog({ verification, onClose, inline = false }: Props) {
  const open = Boolean(verification?.required && verification.enquiryToken);
  const token = verification?.enquiryToken || "";
  const phone = verification?.phone || "";

  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [sent, setSent] = useState("");
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [focused, setFocused] = useState(false);
  const [wrongCode, setWrongCode] = useState(false); // red boxes only for a rejected code
  const inputRef = useRef<HTMLInputElement>(null);

  const sendCode = useCallback(async () => {
    if (!token) return;
    setError("");
    setSending(true);
    try {
      const json = await postJson(SEND_URL, { enquiryToken: token });
      if (json.alreadyVerified) {
        onClose(true); // the parent shows the thank-you message
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
    setCooldown(0);
    sendCode();
  }, [open, token, sendCode]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const verifyCode = async (value = code) => {
    setError("");
    if (!/^\d{6}$/.test(value)) {
      setError("Enter the 6-digit code.");
      return;
    }
    setVerifying(true);
    try {
      await postJson(VERIFY_URL, { enquiryToken: token, code: value });
      onClose(true); // the parent shows the thank-you message
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not verify the code.");
      setCode(""); // wrong code: clear the boxes and let them type again
      setWrongCode(true);
      inputRef.current?.focus();
    } finally {
      setVerifying(false);
    }
  };

  if (!open) return null;

  const close = () => onClose(false);
  const btn =
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

  // fills the boxes from the clipboard (WhatsApp's "Copy code" button puts the code there)
  const pasteCode = async () => {
    try {
      const digits = (await navigator.clipboard.readText()).replace(/\D/g, "").slice(0, 6);
      if (digits.length !== 6) {
        setError("No 6-digit code found on the clipboard. Copy it from WhatsApp first.");
        return;
      }
      setCode(digits);
      verifyCode(digits);
    } catch {
      setError("Couldn't read the clipboard. Tap the boxes and paste the code instead.");
      inputRef.current?.focus();
    }
  };

  const body = (
    <>

            <div className="flex flex-col items-center text-center">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366]/15 text-[#25D366]">
                <FaWhatsapp className="h-7 w-7" />
              </span>
              <h3 id="otp-dialog-title" className="mt-4 text-xl font-bold text-textHeading font-heading">
                Verify your WhatsApp number
              </h3>
              <p className="mt-2 max-w-xs text-sm text-textMuted">
                Enter the 6-digit code we sent to{" "}
                <span className="font-semibold text-textHeading">+91 {phone}</span>
              </p>
            </div>

            {sending && !sent && (
              <p className="mt-4 flex items-center justify-center gap-2 text-sm text-textMuted">
                <Loader2 className="h-4 w-4 animate-spin" /> Sending code…
              </p>
            )}

            {sent && (
              <p
                role="status"
                className="mt-4 flex items-center justify-center gap-1.5 text-xs text-green-700 dark:text-green-400"
              >
                <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                <span>Code sent. It may take up to a minute to arrive.</span>
              </p>
            )}

            <label htmlFor="otp-code" className="sr-only">
              6-digit code
            </label>
            {/* one real input stretched over six boxes: typing, backspace, paste and
                one-time-code autofill all work without juggling focus between fields */}
            <div className="relative mx-auto mt-6 grid max-w-[340px] grid-cols-6 gap-2 sm:gap-3">
              {Array.from({ length: 6 }, (_, i) => {
                const active = focused && (i === code.length || (i === 5 && code.length === 6));
                return (
                  <div
                    key={i}
                    aria-hidden="true"
                    className={`flex aspect-[4/5] items-center justify-center rounded-xl border-2 bg-bgPrimary text-2xl font-semibold text-textHeading transition-colors ${
                      wrongCode
                        ? "border-red-400"
                        : active
                          ? "border-accent ring-4 ring-accent/20"
                          : code[i]
                            ? "border-textHeading/30"
                            : "border-border"
                    }`}
                  >
                    {code[i] ?? (active ? <span className="h-6 w-0.5 animate-pulse bg-accent" /> : "")}
                  </div>
                );
              })}
              <input
                id="otp-code"
                ref={inputRef}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                onChange={(e) => {
                  const next = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setCode(next);
                  setError("");
                  setWrongCode(false);
                  if (next.length === 6) verifyCode(next);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    verifyCode();
                  }
                }}
                className="absolute inset-0 h-full w-full cursor-text bg-transparent text-transparent caret-transparent opacity-0 outline-none"
              />
            </div>

            <p className="mt-3 text-center text-sm">
              <button
                type="button"
                onClick={pasteCode}
                className="font-medium text-accent underline-offset-4 hover:underline"
              >
                Paste code from WhatsApp
              </button>
            </p>

            {error && (
              <p role="alert" className="mt-2 text-center text-sm text-red-500">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={() => verifyCode()}
              disabled={verifying || code.length !== 6}
              className={`btn-primary mt-6 w-full ${btn}`}
            >
              {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & continue"}
            </button>

            <div className="mt-4 flex items-center justify-between text-sm">
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
  );

  if (inline) return <div aria-labelledby="otp-dialog-title">{body}</div>;

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
        {body}
      </div>
    </div>
  );
}
