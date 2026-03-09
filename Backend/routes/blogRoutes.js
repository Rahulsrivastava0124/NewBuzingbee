const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const {
  addBlog,
  getAllBlogs,
  getBlogById,
  updateBlog,
  deleteBlog,
  getBlogStats,
} = require("../controllers/blogController");
const { protectAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const safeExt = ext || ".jpg";
    cb(null, `blog-${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith("image/")) {
      cb(null, true);
      return;
    }
    cb(new Error("Only image files are allowed"));
  },
});

router.post("/add", protectAdmin, upload.single("image"), addBlog);
router.get("/all", getAllBlogs);

// REST-style endpoints used by frontend
router.get("/stats", protectAdmin, getBlogStats);
router.post(
  "/upload-image",
  protectAdmin,
  upload.single("image"),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Image file is required",
      });
    }

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const imageUrl = `${baseUrl}/uploads/${req.file.filename}`;

    return res.status(200).json({
      success: true,
      message: "Image uploaded successfully",
      imageUrl,
    });
  },
);
router.get("/", getAllBlogs); // Public endpoint for fetching blogs
router.get("/:id", getBlogById); // Public endpoint for fetching single blog
router.post("/", protectAdmin, upload.single("image"), addBlog);
router.put("/:id", protectAdmin, upload.single("image"), updateBlog);
router.delete("/:id", protectAdmin, deleteBlog);

module.exports = router;
