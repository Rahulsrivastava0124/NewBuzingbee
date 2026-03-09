const express = require("express");
const {
  trackAnalyticsEvent,
  getAnalyticsOverview,
  getHourlyAnalytics,
  getDetailedAnalytics,
} = require("../controllers/analyticsController");
const { protectAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

// Public tracking endpoint for website/app events
router.post("/track", trackAnalyticsEvent);

// Admin dashboard analytics
router.get("/overview", protectAdmin, getAnalyticsOverview);
router.get("/hourly", protectAdmin, getHourlyAnalytics);
router.get("/detailed", protectAdmin, getDetailedAnalytics);

module.exports = router;
