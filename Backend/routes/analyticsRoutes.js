const express = require("express");
const rateLimit = require("express-rate-limit");
const {
  trackAnalyticsEvent,
  getAnalyticsOverview,
  getHourlyAnalytics,
  getDetailedAnalytics,
} = require("../controllers/analyticsController");
const { protectAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

// Public tracking endpoint for website/app events. Real visitors send one event
// per page view; this stops scripted floods.
const trackLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many tracking events" },
});

router.post("/track", trackLimiter, trackAnalyticsEvent);

// Admin dashboard analytics
router.get("/overview", protectAdmin, getAnalyticsOverview);
router.get("/hourly", protectAdmin, getHourlyAnalytics);
router.get("/detailed", protectAdmin, getDetailedAnalytics);

module.exports = router;
