const express = require("express");
const {
  addBlog,
  getAllBlogs,
  getBlogById,
  getBlogBySlug,
  updateBlog,
  deleteBlog,
  getBlogStats,
  getBlogViewsDaily,
} = require("../controllers/blogController");
const { protectAdmin, optionalAdmin } = require("../middleware/authMiddleware");
const { uploadBlogImage } = require("../middleware/uploadMiddleware");
const { uploadBlogImageAndGetUrl } = require("../services/storageService");

const router = express.Router();

router.post("/add", protectAdmin, uploadBlogImage.single("image"), addBlog);
router.get("/all", optionalAdmin, getAllBlogs);

// REST-style endpoints used by frontend
router.get("/stats", protectAdmin, getBlogStats);
// Before "/:id" so "views" is not read as a blog id
router.get("/views/daily", protectAdmin, getBlogViewsDaily);
router.post(
  "/upload-image",
  protectAdmin,
  uploadBlogImage.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Image file is required",
        });
      }

      const imageUrl = await uploadBlogImageAndGetUrl(req, req.file);

      return res.status(200).json({
        success: true,
        message: "Image uploaded successfully",
        imageUrl,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to upload image",
        error: error.message,
      });
    }
  },
);
router.get("/", optionalAdmin, getAllBlogs); // Public: published only unless an admin token is sent
router.get("/slug/:slug", optionalAdmin, getBlogBySlug); // Public endpoint for fetching single blog by slug
router.get("/:id", optionalAdmin, getBlogById); // Public endpoint for fetching single blog
router.post("/", protectAdmin, uploadBlogImage.single("image"), addBlog);
router.put("/:id", protectAdmin, uploadBlogImage.single("image"), updateBlog);
router.delete("/:id", protectAdmin, deleteBlog);

module.exports = router;
