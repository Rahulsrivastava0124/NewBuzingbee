// WhatsApp OTP delivery through authkey.io, plus helpers for enquiry phone verification.
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { getJwtSecret, parseList } = require("../config");

const SEND_URL = "https://api.authkey.io/request";
const OTP_TTL_MS = 10 * 60 * 1000;
const TOKEN_TTL = "60m";
const TOKEN_PURPOSE = "enquiry-phone";
// approved authkey.io template "sent_otp" (Authentication, {{1}} = code); AUTHKEY_OTP_WID overrides it
const OTP_WID = process.env.AUTHKEY_OTP_WID || "55580";
// approved template "login_otp" for admin panel sign-in codes; AUTHKEY_LOGIN_OTP_WID overrides it
const LOGIN_OTP_WID = process.env.AUTHKEY_LOGIN_OTP_WID || "55579";

const isOtpEnabled = () =>
  Boolean(process.env.AUTHKEY_API_KEY && OTP_WID);

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

// Sends an approved WhatsApp template (numeric WID); values[0] fills {{1}}, values[1] {{2}}...
const sendWhatsAppTemplate = async (phone, wid, values = []) => {
  const params = new URLSearchParams({
    authkey: process.env.AUTHKEY_API_KEY,
    mobile: phone,
    country_code: process.env.AUTHKEY_COUNTRY_CODE || "91",
    wid,
  });
  values.forEach((value, i) => params.set(String(i + 1), value));

  const response = await fetch(`${SEND_URL}?${params}`, {
    signal: AbortSignal.timeout(10000),
  });
  const text = await response.text();
  if (!response.ok || !/submitted successfully/i.test(text)) {
    throw new Error(`authkey.io send failed (${response.status}): ${text.slice(0, 200)}`);
  }
};

// Sends a one-time code; the template's {{1}} is the code
const sendWhatsAppOtp = (phone, code, wid = OTP_WID) => sendWhatsAppTemplate(phone, wid, [code]);

// Returned after an enquiry is saved: lets that visitor (and only for that phone)
// send and check an OTP for this one enquiry.
const issueEnquiryToken = (enquiryId, phone) =>
  jwt.sign({ enquiryId: String(enquiryId), phone, purpose: TOKEN_PURPOSE }, getJwtSecret(), {
    expiresIn: TOKEN_TTL,
  });

// Returns { enquiryId, phone } or null
const readEnquiryToken = (token) => {
  if (typeof token !== "string" || !token || token.length > 1024) return null;
  try {
    const payload = jwt.verify(token, getJwtSecret());
    if (payload.purpose !== TOKEN_PURPOSE || !payload.enquiryId || !payload.phone) return null;
    return { enquiryId: payload.enquiryId, phone: payload.phone };
  } catch {
    return null;
  }
};

module.exports = {
  OTP_TTL_MS,
  LOGIN_OTP_WID,
  isOtpEnabled,
  otpRequiredFor,
  normalizeIndianMobile,
  generateCode,
  hashCode,
  codesMatch,
  sendWhatsAppOtp,
  sendWhatsAppTemplate,
  issueEnquiryToken,
  readEnquiryToken,
};
