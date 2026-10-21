const express = require("express");
const {
  addCaseStudy,
  getAllCaseStudies,
  getCaseStudyById,
  getCaseStudyBySlug,
  updateCaseStudy,
  deleteCaseStudy,
  getCaseStudyStats,
} = require("../controllers/caseStudyController");
const { protectAdmin, optionalAdmin } = require("../middleware/authMiddleware");
const { uploadBlogImage } = require("../middleware/uploadMiddleware");

const router = express.Router();

// Public
router.get("/", optionalAdmin, getAllCaseStudies);
router.get("/slug/:slug", optionalAdmin, getCaseStudyBySlug);

// Protected
router.get("/stats", protectAdmin, getCaseStudyStats);
router.post("/", protectAdmin, uploadBlogImage.single("image"), addCaseStudy);
router.get("/:id", optionalAdmin, getCaseStudyById);
router.put(
  "/:id",
  protectAdmin,
  uploadBlogImage.single("image"),
  updateCaseStudy,
);
router.delete("/:id", protectAdmin, deleteCaseStudy);

module.exports = router;
