const express = require("express");
const rateLimit = require("express-rate-limit");
const {
  adminRegister,
  adminLogin,
  getAdminProfile,
  updateAdminProfile,
  updatePaymentDetails,
  forgotPassword,
  resetPassword,
  listAdmins,
  updateAdminRole,
  deleteAdmin,
  sendPasswordOtp,
} = require("../controllers/adminController");
const { protectAdmin, requireSuper } = require("../middleware/authMiddleware");
const { listAuditLog } = require("../middleware/auditLog");

const {
  checkSmtpConnection,
  logSmtpStatus,
  sendMail,
  getConfig,
} = require("../services/mailService");

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Try again later.",
  },
});

// Only a signed-in admin can create another admin account
router.post("/register", authLimiter, protectAdmin, adminRegister);
// Reset flow is public, so each step gets its own tight limiter
const makeResetLimiter = (max) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: "Too many reset attempts. Try again later.",
    },
  });
const forgotLimiter = makeResetLimiter(5);
const resetLimiter = makeResetLimiter(10);

router.post("/login", authLimiter, adminLogin);
router.post("/forgot-password", forgotLimiter, forgotPassword);
router.post("/reset-password", resetLimiter, resetPassword);
router.get("/smtp/status", protectAdmin, requireSuper, async (_req, res) => {
  const status = await checkSmtpConnection();
  logSmtpStatus(status);
  // Never include credentials; status only carries host/port/user/outcome.
  return res.status(status.connected ? 200 : 503).json({ success: status.connected, smtp: status });
});

router.post("/smtp/test", protectAdmin, requireSuper, async (req, res) => {
  const config = getConfig();
  const to = String(req.body?.to || config.user || "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return res
      .status(400)
      .json({ success: false, message: "A valid recipient email is required" });
  }
  try {
    const info = await sendMail({
      to,
      subject: "BuzingBee SMTP test",
      text: `This is a test email sent from the BuzingBee admin API at ${new Date().toISOString()}.`,
    });
    return res.json({
      success: true,
      message: `Test email sent to ${to}`,
      messageId: info.messageId,
    });
  } catch (error) {
    return res.status(502).json({
      success: false,
      message: "Failed to send test email",
      error: error.message,
    });
  }
});

// Audit log of admin actions: super admin only now that there are roles
router.get("/audit-log", protectAdmin, requireSuper, listAuditLog);
router.get("/users", protectAdmin, listAdmins);
router.patch("/users/:id", protectAdmin, requireSuper, updateAdminRole);
router.delete("/users/:id", protectAdmin, requireSuper, deleteAdmin);
router.get("/profile", protectAdmin, getAdminProfile);
router.put("/profile", protectAdmin, updateAdminProfile);
router.put("/profile/payment", protectAdmin, updatePaymentDetails);
router.post("/profile/password-otp", protectAdmin, makeResetLimiter(5), sendPasswordOtp);

module.exports = router;
