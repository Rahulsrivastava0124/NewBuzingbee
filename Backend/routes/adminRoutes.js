const express = require("express");
const rateLimit = require("express-rate-limit");
const {
  adminRegister,
  adminLogin,
  getAdminProfile,
  updateAdminProfile,
} = require("../controllers/adminController");
const { protectAdmin } = require("../middleware/authMiddleware");

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

router.post("/register", authLimiter, adminRegister);
router.post("/login", authLimiter, adminLogin);
router.get("/profile", protectAdmin, getAdminProfile);
router.put("/profile", protectAdmin, updateAdminProfile);

module.exports = router;
