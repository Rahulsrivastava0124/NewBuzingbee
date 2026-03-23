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
const { protectAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

// Rate-limit public submission to prevent spam
const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 5,
  message: { success: false, message: "Too many submissions. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public
router.post("/submit", submitLimiter, submitEnquiry);

// Admin-protected
router.get("/stats", protectAdmin, getEnquiryStats);
router.get("/", protectAdmin, getAllEnquiries);
router.get("/:id", protectAdmin, getEnquiryById);
router.put("/:id", protectAdmin, updateEnquiry);
router.delete("/:id", protectAdmin, deleteEnquiry);

module.exports = router;
