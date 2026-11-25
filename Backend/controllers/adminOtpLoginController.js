// Admin panel sign-in. There are no passwords: an admin gets a one-time code by
// WhatsApp (to the phone saved on the account, template "login_otp") or by email
// (to the account's address). Works for every role, including the super admin;
// finishLogin applies the portal check and issues the token.
const Admin = require("../models/Admin");
const OtpCode = require("../models/OtpCode");
const { errorDetail } = require("../utils/errors");
const { logAuthEvent } = require("../middleware/auditLog");
const { finishLogin } = require("./adminController");
const { sendMail } = require("../services/mailService");
const {
  OTP_TTL_MS,
  LOGIN_OTP_WID,
  isOtpEnabled,
  normalizeIndianMobile,
  generateCode,
  hashCode,
  codesMatch,
  sendWhatsAppOtp,
} = require("../utils/whatsappOtp");

const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

// Kept apart from enquiry codes for the same number
const otpKey = (phone) => `admin-login:${phone}`;

// Admin phones are stored as typed ("+91 95079 81942"), so match on the normalised number
const findAdminsByPhone = async (phone) => {
  const admins = await Admin.find({ phone: { $nin: ["", null] } });
  return admins.filter((a) => normalizeIndianMobile(a.phone) === phone);
};

const readPhone = (req) => normalizeIndianMobile(req.body?.phone);

const badPhone = (res) =>
  res.status(400).json({ success: false, message: "Enter a valid 10-digit Indian mobile number." });

// PUBLIC: send a sign-in code to the WhatsApp number on an admin account.
// The reply is the same whether or not the number belongs to an account,
// so it never reveals which numbers have accounts.
const sendLoginOtp = async (req, res) => {
  try {
    if (!isOtpEnabled()) {
      return res
        .status(503)
        .json({ success: false, message: "WhatsApp sign-in is not available right now. Use your password." });
    }

    const phone = readPhone(req);
    if (!phone) return badPhone(res);
    const key = otpKey(phone);

    const latest = await OtpCode.findOne({ phone: key }).sort({ createdAt: -1 });
    if (latest && Date.now() - latest.createdAt.getTime() < RESEND_COOLDOWN_MS) {
      const wait = Math.ceil((RESEND_COOLDOWN_MS - (Date.now() - latest.createdAt.getTime())) / 1000);
      return res.status(429).json({
        success: false,
        message: `Please wait ${wait}s before requesting a new code.`,
        retryAfter: wait,
      });
    }

    const reply = {
      success: true,
      message: "Code sent on WhatsApp.",
      expiresInSeconds: OTP_TTL_MS / 1000,
      resendAfterSeconds: RESEND_COOLDOWN_MS / 1000,
    };

    const admins = await findAdminsByPhone(phone);
    if (admins.length === 0) {
      logAuthEvent(req, { action: "login_failed", username: `phone:${phone}`, success: false });
      return res.status(200).json(reply);
    }
    if (admins.length > 1) {
      return res.status(409).json({
        success: false,
        message: "This number is linked to more than one account. Sign in with your password instead.",
      });
    }

    const code = generateCode();
    await sendWhatsAppOtp(phone, code, LOGIN_OTP_WID);

    // Only the newest code for a number stays valid
    await OtpCode.deleteMany({ phone: key });
    await OtpCode.create({
      phone: key,
      codeHash: hashCode(key, code),
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    });

    return res.status(200).json(reply);
  } catch (error) {
    console.error("[admin-otp] send failed:", error.message);
    return res.status(502).json({
      success: false,
      message: "Could not send the code. Please try again.",
      error: errorDetail(error),
    });
  }
};

// PUBLIC: check the code and sign the admin in
const verifyLoginOtp = async (req, res) => {
  try {
    const phone = readPhone(req);
    if (!phone) return badPhone(res);
    const key = otpKey(phone);

    const code = typeof req.body?.code === "string" ? req.body.code.trim() : "";
    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({ success: false, message: "Enter the 6-digit code sent to your WhatsApp." });
    }

    const record = await OtpCode.findOne({ phone: key }).sort({ createdAt: -1 });
    if (!record || record.expiresAt.getTime() < Date.now()) {
      return res.status(400).json({ success: false, message: "This code has expired. Please request a new one." });
    }
    if (record.attempts >= MAX_ATTEMPTS) {
      return res.status(429).json({ success: false, message: "Too many wrong attempts. Please request a new code." });
    }

    if (!codesMatch(key, code, record.codeHash)) {
      record.attempts += 1;
      await record.save();
      logAuthEvent(req, { action: "login_failed", username: `phone:${phone}`, success: false });
      const left = MAX_ATTEMPTS - record.attempts;
      return res.status(400).json({
        success: false,
        message:
          left > 0 ? `Incorrect code. ${left} attempt(s) left.` : "Too many wrong attempts. Please request a new code.",
      });
    }

    await OtpCode.deleteMany({ phone: key });

    // Re-check: the number may have been removed from the account since the code was sent
    const admins = await findAdminsByPhone(phone);
    if (admins.length !== 1) {
      return res.status(401).json({ success: false, message: "This number is not linked to an account." });
    }

    return await finishLogin(req, res, admins[0]);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Could not verify the code. Please try again.",
      error: errorDetail(error),
    });
  }
};

// ── Email code sign-in ──────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const emailKey = (email) => `admin-email-login:${email}`;
const readEmail = (req) => {
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  return EMAIL_RE.test(email) && email.length <= 254 ? email : null;
};
const badEmail = (res) =>
  res.status(400).json({ success: false, message: "Enter a valid email address." });

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);

const buildCodeEmail = (admin, code) => ({
  subject: `${code} is your BuzingBee admin sign-in code`,
  text: [
    `Hi ${admin.username},`,
    "",
    `Your BuzingBee admin sign-in code is ${code}.`,
    "It works once and expires in 10 minutes.",
    "",
    "If you did not try to sign in, ignore this email.",
  ].join("\n"),
  html: `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#0f172a">
      <h2 style="margin:0 0 12px">Your sign-in code</h2>
      <p>Hi ${escapeHtml(admin.username)},</p>
      <p>Use this code to sign in to the BuzingBee admin panel:</p>
      <p style="font-size:32px;font-weight:bold;letter-spacing:8px;margin:20px 0">${code}</p>
      <p style="color:#64748b;font-size:13px">It works once and expires in 10 minutes.
      If you did not try to sign in, ignore this email.</p>
    </div>`,
});

// PUBLIC: email a sign-in code to an admin account's address.
// The reply is the same whether or not the address belongs to an account.
const sendEmailLoginOtp = async (req, res) => {
  try {
    const email = readEmail(req);
    if (!email) return badEmail(res);
    const key = emailKey(email);

    const latest = await OtpCode.findOne({ phone: key }).sort({ createdAt: -1 });
    if (latest && Date.now() - latest.createdAt.getTime() < RESEND_COOLDOWN_MS) {
      const wait = Math.ceil((RESEND_COOLDOWN_MS - (Date.now() - latest.createdAt.getTime())) / 1000);
      return res.status(429).json({
        success: false,
        message: `Please wait ${wait}s before requesting a new code.`,
        retryAfter: wait,
      });
    }

    const reply = {
      success: true,
      message: "Code sent to your email.",
      expiresInSeconds: OTP_TTL_MS / 1000,
      resendAfterSeconds: RESEND_COOLDOWN_MS / 1000,
    };

    const admin = await Admin.findOne({ email });
    if (!admin) {
      logAuthEvent(req, { action: "login_failed", username: email, success: false });
      return res.status(200).json(reply);
    }

    const code = generateCode();
    await sendMail({ to: admin.email, ...buildCodeEmail(admin, code) });

    await OtpCode.deleteMany({ phone: key });
    await OtpCode.create({
      phone: key,
      codeHash: hashCode(key, code),
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    });

    return res.status(200).json(reply);
  } catch (error) {
    console.error("[admin-otp] email send failed:", error.message);
    return res.status(502).json({
      success: false,
      message: "Could not send the code. Please try again.",
      error: errorDetail(error),
    });
  }
};

// PUBLIC: check the emailed code and sign the admin in
const verifyEmailLoginOtp = async (req, res) => {
  try {
    const email = readEmail(req);
    if (!email) return badEmail(res);
    const key = emailKey(email);

    const code = typeof req.body?.code === "string" ? req.body.code.trim() : "";
    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({ success: false, message: "Enter the 6-digit code from your email." });
    }

    const record = await OtpCode.findOne({ phone: key }).sort({ createdAt: -1 });
    if (!record || record.expiresAt.getTime() < Date.now()) {
      return res.status(400).json({ success: false, message: "This code has expired. Please request a new one." });
    }
    if (record.attempts >= MAX_ATTEMPTS) {
      return res.status(429).json({ success: false, message: "Too many wrong attempts. Please request a new code." });
    }

    if (!codesMatch(key, code, record.codeHash)) {
      record.attempts += 1;
      await record.save();
      logAuthEvent(req, { action: "login_failed", username: email, success: false });
      const left = MAX_ATTEMPTS - record.attempts;
      return res.status(400).json({
        success: false,
        message:
          left > 0 ? `Incorrect code. ${left} attempt(s) left.` : "Too many wrong attempts. Please request a new code.",
      });
    }

    await OtpCode.deleteMany({ phone: key });

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ success: false, message: "This email is not linked to an account." });
    }

    return await finishLogin(req, res, admin);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Could not verify the code. Please try again.",
      error: errorDetail(error),
    });
  }
};

module.exports = {
  sendLoginOtp,
  verifyLoginOtp,
  sendEmailLoginOtp,
  verifyEmailLoginOtp,
  findAdminsByPhone,
};
