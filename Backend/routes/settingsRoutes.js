const express = require("express");
const { protectAdmin } = require("../middleware/authMiddleware");
const { uploadLogo: uploadLogoFile } = require("../middleware/uploadMiddleware");
const {
  uploadLogo,
  removeLogo,
  getSettings,
  updateCompany,
  updateSmtp,
  testSmtp,
} = require("../controllers/settingsController");

const router = express.Router();

// Company details and SMTP credentials are admin-only
router.use(protectAdmin);

router.get("/", getSettings);
router.put("/company", updateCompany);
router.post("/company/logo", (req, res, next) => {
  // Surface multer errors (size, type) as JSON instead of the default 500
  uploadLogoFile.single("logo")(req, res, (error) => {
    if (error) {
      return res.status(400).json({
        success: false,
        message:
          error.code === "LIMIT_FILE_SIZE"
            ? "Logo must be 2 MB or smaller"
            : error.message,
      });
    }
    return next();
  });
}, uploadLogo);
router.delete("/company/logo", removeLogo);
router.put("/smtp", updateSmtp);
router.post("/smtp/test", testSmtp);

module.exports = router;
