"use client";

import { useEffect, useState } from "react";
import { CheckCircle, Loader2 } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.buzingbee.com/api";
const SEND_URL = `${API_BASE}/enquiries/otp/send`;
const VERIFY_URL = `${API_BASE}/enquiries/otp/verify`;

type Props = {
  value: string;
  onChange: (phone: string) => void;
  // receives the verification token, or "" when the number is not (or no longer) verified
  onVerified: (token: string) => void;
  inputClassName: string;
  // bump to clear the field after a successful submission
  resetSignal?: number;
};

const digitsOnly = (v: string) => v.replace(/\D/g, "");
const isValidMobile = (v: string) => {
  let d = digitsOnly(v);
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  return /^[6-9]\d{9}$/.test(d);
};

const postJson = async (url: string, body: Record<string, string>) => {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Something went wrong. Please try again.");
  }
  return json;
};

// WhatsApp OTP check for the enquiry phone number
export default function PhoneOtpField({
  value,
  onChange,
  onVerified,
  inputClassName,
  resetSignal = 0,
}: Props) {
  const [stage, setStage] = useState<"enter" | "code" | "verified">("enter");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => {
    if (!resetSignal) return;
    setStage("enter");
    setCode("");
    setError("");
    setInfo("");
  }, [resetSignal]);

  const changePhone = (next: string) => {
    onChange(next);
    if (stage !== "enter") {
      setStage("enter");
      setCode("");
      setInfo("");
      onVerified("");
    }
    setError("");
  };

  const sendCode = async () => {
    setError("");
    if (!isValidMobile(value)) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }
    setBusy(true);
    try {
      const json = await postJson(SEND_URL, { phone: value });
      setStage("code");
      setInfo(
        `OTP sent successfully to your WhatsApp (+91 ${value.replace(/\D/g, "").slice(-10)}).`,
      );
      setCooldown(Number(json.resendAfterSeconds) || 60);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the code.");
    } finally {
      setBusy(false);
    }
  };

  const verifyCode = async () => {
    setError("");
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6-digit code.");
      return;
    }
    setBusy(true);
    try {
      const json = await postJson(VERIFY_URL, { phone: value, code });
      setStage("verified");
      setInfo("");
      onVerified(json.phoneToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not verify the code.");
    } finally {
      setBusy(false);
    }
  };

  const buttonClass =
    "shrink-0 rounded-xl border border-accent/40 bg-accent/10 px-4 text-sm font-semibold text-accent transition-colors hover:bg-accent hover:text-white disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="space-y-2">
      <label htmlFor="enquiry-phone" className="sr-only">
        WhatsApp number
      </label>
      <div className="flex gap-2">
        <input
          id="enquiry-phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={value}
          onChange={(e) => changePhone(e.target.value)}
          placeholder="WhatsApp Number *"
          className={inputClassName}
        />
        {stage === "verified" ? (
          <span className="inline-flex shrink-0 items-center gap-1 px-2 text-sm font-semibold text-green-500">
            <CheckCircle className="h-4 w-4" /> Verified
          </span>
        ) : (
          <button
            type="button"
            onClick={sendCode}
            disabled={busy || cooldown > 0}
            className={buttonClass}
          >
            {busy && stage === "enter" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : stage === "code" ? (
              cooldown > 0 ? `Resend ${cooldown}s` : "Resend"
            ) : (
              "Send OTP"
            )}
          </button>
        )}
      </div>

      {stage === "code" && (
        <div className="flex gap-2">
          <label htmlFor="enquiry-otp" className="sr-only">
            6-digit code
          </label>
          <input
            id="enquiry-otp"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(digitsOnly(e.target.value).slice(0, 6))}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                verifyCode();
              }
            }}
            placeholder="Enter 6-digit code"
            className={inputClassName}
          />
          <button type="button" onClick={verifyCode} disabled={busy} className={buttonClass}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
          </button>
        </div>
      )}

      {info && (
        <p
          role="status"
          className="flex items-start gap-2 rounded-xl border border-green-500/30 bg-green-500/10 px-3 py-2 text-xs text-green-700 dark:text-green-400"
        >
          <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            {info} It may take up to a minute to arrive. Enter it above and tap Verify.
          </span>
        </p>
      )}
      {error && (
        <p className="text-xs text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
