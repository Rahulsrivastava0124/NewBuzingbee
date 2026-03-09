const express = require("express");
const {
  addBlog,
  getAllBlogs,
  getBlogById,
  updateBlog,
  deleteBlog,
  getBlogStats,
} = require("../controllers/blogController");
const { protectAdmin } = require("../middleware/authMiddleware");
const { uploadBlogImage } = require("../middleware/uploadMiddleware");

const router = express.Router();

router.post("/add", protectAdmin, uploadBlogImage.single("image"), addBlog);
router.get("/all", getAllBlogs);

// REST-style endpoints used by frontend
router.get("/stats", protectAdmin, getBlogStats);
router.post(
  "/upload-image",
  protectAdmin,
  uploadBlogImage.single("image"),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Image file is required",
      });
    }

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const imageUrl = `${baseUrl}/uploads/blogs/${req.file.filename}`;

    return res.status(200).json({
      success: true,
      message: "Image uploaded successfully",
      imageUrl,
    });
  },
);
router.get("/", getAllBlogs); // Public endpoint for fetching blogs
router.get("/:id", getBlogById); // Public endpoint for fetching single blog
router.post("/", protectAdmin, uploadBlogImage.single("image"), addBlog);
router.put("/:id", protectAdmin, uploadBlogImage.single("image"), updateBlog);
router.delete("/:id", protectAdmin, deleteBlog);

module.exports = router;
