const OtpCode = require("../models/OtpCode");
const Enquiry = require("../models/Enquiry");
const { errorDetail } = require("../utils/errors");
const { sendMail } = require("../services/mailService");
const { alertTeam } = require("../services/leadAlert");
const { createLeadFromEnquiry } = require("../services/enquiryToLead");
const {
  OTP_TTL_MS,
  isOtpEnabled,
  generateCode,
  hashCode,
  codesMatch,
  sendWhatsAppOtp,
  readEnquiryToken,
} = require("../utils/whatsappOtp");

const RESEND_COOLDOWN_MS = 60 * 1000;

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);

// "We'll connect with you shortly" note, sent once the enquiry's phone is verified
// (only then, so the public form can't be used to mail arbitrary addresses)
const buildThanksEmail = (enquiry) => {
  const first = String(enquiry.name || "").trim().split(/\s+/)[0] || "there";
  return {
    subject: "Thanks for reaching out — Sunny from BuzingBee will connect with you shortly",
    text: [
      `Hi ${first},`,
      "",
      "Thank you for your enquiry. Your WhatsApp number is verified.",
      "Sunny from our team is reviewing your details and will reach out to you shortly.",
      "",
      "If you need anything in the meantime, just reply to this email.",
      "",
      "Team BuzingBee",
      "https://buzingbee.com",
    ].join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#0f172a">
        <h2 style="margin:0 0 12px">Thanks, ${escapeHtml(first)}! 🐝</h2>
        <p>Thank you for your enquiry. Your WhatsApp number is verified.</p>
        <p><strong>Sunny</strong> from our team is reviewing your details and <strong>will reach out to you shortly</strong>.</p>
        <p>If you need anything in the meantime, just reply to this email.</p>
        <p style="margin-top:24px">Team BuzingBee<br>
          <a href="https://buzingbee.com" style="color:#f5a623">buzingbee.com</a></p>
      </div>`,
  };
};
const MAX_ATTEMPTS = 5;

const badToken = (res) =>
  res.status(400).json({
    success: false,
    message: "This verification link has expired. Your enquiry is saved; we'll contact you soon.",
  });

// PUBLIC: send a 6-digit code over WhatsApp to the phone of a just-submitted enquiry.
// The enquiry token (returned by /submit) decides the number, so this endpoint cannot
// be used to message arbitrary numbers.
const sendOtp = async (req, res) => {
  try {
    if (!isOtpEnabled()) {
      return res
        .status(503)
        .json({ success: false, message: "Phone verification is not available right now." });
    }

    const token = readEnquiryToken(req.body?.enquiryToken);
    if (!token) return badToken(res);
    const { phone } = token;

    const enquiry = await Enquiry.findById(token.enquiryId).select("phoneVerified");
    if (!enquiry) return badToken(res);
    if (enquiry.phoneVerified) {
      return res.status(200).json({ success: true, alreadyVerified: true, message: "Phone number already verified." });
    }

    const latest = await OtpCode.findOne({ phone }).sort({ createdAt: -1 });
    if (latest && Date.now() - latest.createdAt.getTime() < RESEND_COOLDOWN_MS) {
      const wait = Math.ceil(
        (RESEND_COOLDOWN_MS - (Date.now() - latest.createdAt.getTime())) / 1000,
      );
      return res.status(429).json({
        success: false,
        message: `Please wait ${wait}s before requesting a new code.`,
        retryAfter: wait,
      });
    }

    const code = generateCode();
    await sendWhatsAppOtp(phone, code);

    // only the newest code for a number stays valid
    await OtpCode.deleteMany({ phone });
    await OtpCode.create({
      phone,
      codeHash: hashCode(phone, code),
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    });

    return res.status(200).json({
      success: true,
      message: `OTP sent successfully to your WhatsApp (+91 ${phone}).`,
      phone,
      expiresInSeconds: OTP_TTL_MS / 1000,
      resendAfterSeconds: RESEND_COOLDOWN_MS / 1000,
    });
  } catch (error) {
    console.error("[otp] send failed:", error.message);
    return res.status(502).json({
      success: false,
      message: "Could not send the code. Please try again.",
      error: errorDetail(error),
    });
  }
};

// PUBLIC: check the code and mark the enquiry's phone as verified
const verifyOtp = async (req, res) => {
  try {
    const token = readEnquiryToken(req.body?.enquiryToken);
    if (!token) return badToken(res);
    const { phone, enquiryId } = token;

    const code = typeof req.body?.code === "string" ? req.body.code.trim() : "";
    if (!/^\d{6}$/.test(code)) {
      return res
        .status(400)
        .json({ success: false, message: "Enter the 6-digit code sent to your WhatsApp." });
    }

    const record = await OtpCode.findOne({ phone }).sort({ createdAt: -1 });
    if (!record || record.expiresAt.getTime() < Date.now()) {
      return res
        .status(400)
        .json({ success: false, message: "This code has expired. Please request a new one." });
    }
    if (record.attempts >= MAX_ATTEMPTS) {
      return res
        .status(429)
        .json({ success: false, message: "Too many wrong attempts. Please request a new code." });
    }

    if (!codesMatch(phone, code, record.codeHash)) {
      record.attempts += 1;
      await record.save();
      const left = MAX_ATTEMPTS - record.attempts;
      return res.status(400).json({
        success: false,
        message:
          left > 0
            ? `Incorrect code. ${left} attempt(s) left.`
            : "Too many wrong attempts. Please request a new code.",
      });
    }

    await OtpCode.deleteMany({ phone });
    // "before" tells whether this call is the one that verified it, so the team
    // alert and the thank-you email go out exactly once
    const before = await Enquiry.findByIdAndUpdate(
      enquiryId,
      { phoneVerified: true, phoneVerifiedAt: new Date() },
      { returnDocument: "before" },
    );
    if (!before) return badToken(res);
    if (before.phoneVerified) {
      return res.status(200).json({ success: true, message: "Your WhatsApp number is verified. Thank you!" });
    }
    const enquiry = before;

    // Verified leads go into the CRM, then the team is told (email + WhatsApp).
    // Neither is awaited: a problem there must not fail the visitor's verification.
    createLeadFromEnquiry(enquiry)
      .catch((error) => console.error("[otp] CRM lead creation failed:", error.message))
      .finally(() => alertTeam(enquiry));

    if (enquiry.email) {
      sendMail({ to: enquiry.email, ...buildThanksEmail(enquiry) }).catch((error) => {
        console.error("[otp] thank-you email failed:", error.message);
      });
    }

    return res.status(200).json({ success: true, message: "Your WhatsApp number is verified. Thank you!" });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Could not verify the code. Please try again.",
      error: errorDetail(error),
    });
  }
};

module.exports = { sendOtp, verifyOtp };
