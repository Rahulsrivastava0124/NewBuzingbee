// WhatsApp OTP delivery through authkey.io, plus helpers for enquiry phone verification.
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { getJwtSecret, parseList } = require("../config");

const SEND_URL = "https://api.authkey.io/request";
const OTP_TTL_MS = 10 * 60 * 1000;
const TOKEN_TTL = "30m";
const TOKEN_PURPOSE = "enquiry-phone";

const isOtpEnabled = () =>
  Boolean(process.env.AUTHKEY_API_KEY && process.env.AUTHKEY_OTP_WID);

// Sites whose enquiries must carry a verified phone (default: the BuzingBee website only)
const otpRequiredFor = (site) =>
  isOtpEnabled() &&
  parseList(process.env.ENQUIRY_OTP_SITES || "buzingbee").includes(site);

// Indian mobile number as 10 digits; accepts "+91 95079 81942", "09507981942", etc.
const normalizeIndianMobile = (value) => {
  if (typeof value !== "string") return null;
  let digits = value.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
};

const generateCode = () => String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");

const hashCode = (phone, code) =>
  crypto.createHmac("sha256", getJwtSecret()).update(`${phone}:${code}`).digest("hex");

const codesMatch = (phone, code, storedHash) => {
  const a = Buffer.from(hashCode(phone, code), "hex");
  const b = Buffer.from(String(storedHash), "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

// Sends the code with the approved WhatsApp template (numeric WID); "1" fills {{1}}.
const sendWhatsAppOtp = async (phone, code) => {
  const params = new URLSearchParams({
    authkey: process.env.AUTHKEY_API_KEY,
    mobile: phone,
    country_code: process.env.AUTHKEY_COUNTRY_CODE || "91",
    wid: process.env.AUTHKEY_OTP_WID,
    1: code,
  });

  const response = await fetch(`${SEND_URL}?${params}`, {
    signal: AbortSignal.timeout(10000),
  });
  const text = await response.text();
  if (!response.ok || !/submitted successfully/i.test(text)) {
    throw new Error(`authkey.io send failed (${response.status}): ${text.slice(0, 200)}`);
  }
};

// Short-lived proof that a phone number passed OTP verification
const issuePhoneToken = (phone) =>
  jwt.sign({ phone, purpose: TOKEN_PURPOSE }, getJwtSecret(), { expiresIn: TOKEN_TTL });

const verifyPhoneToken = (token, phone) => {
  if (typeof token !== "string" || !token || token.length > 1024) return false;
  try {
    const payload = jwt.verify(token, getJwtSecret());
    return payload.purpose === TOKEN_PURPOSE && payload.phone === phone;
  } catch {
    return false;
  }
};

module.exports = {
  OTP_TTL_MS,
  isOtpEnabled,
  otpRequiredFor,
  normalizeIndianMobile,
  generateCode,
  hashCode,
  codesMatch,
  sendWhatsAppOtp,
  issuePhoneToken,
  verifyPhoneToken,
};
