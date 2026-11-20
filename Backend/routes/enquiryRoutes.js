const express = require("express");
const rateLimit = require("express-rate-limit");
const {
  submitEnquiry,
  getAllEnquiries,
  getEnquiryById,
  updateEnquiry,
  deleteEnquiry,
  getEnquiryStats,
} = require("../controllers/enquiryController");
const { sendOtp, verifyOtp } = require("../controllers/otpController");
const { protectAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

// Rate-limit public submission to prevent spam
const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 5,
  message: {
    success: false,
    message: "Too many submissions. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Phone verification (WhatsApp OTP): caps per IP on top of the per-number cooldown
const otpSendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: "Too many code requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});
const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: "Too many attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public
router.post("/otp/send", otpSendLimiter, sendOtp);
router.post("/otp/verify", otpVerifyLimiter, verifyOtp);
router.post("/submit", submitLimiter, submitEnquiry);

// Admin-protected
router.get("/stats", protectAdmin, getEnquiryStats);
router.get("/", protectAdmin, getAllEnquiries);
router.get("/:id", protectAdmin, getEnquiryById);
router.put("/:id", protectAdmin, updateEnquiry);
router.delete("/:id", protectAdmin, deleteEnquiry);

module.exports = router;
