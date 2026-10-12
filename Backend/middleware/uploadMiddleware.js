const multer = require("multer");
const storage = multer.memoryStorage();

const uploadBlogImage = multer({
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

// Logos: raster formats only (SVG can carry scripts), 2 MB cap
const LOGO_TYPES = ["image/png", "image/jpeg", "image/webp"];

const uploadLogo = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (LOGO_TYPES.includes(file.mimetype)) {
      cb(null, true);
      return;
    }
    cb(new Error("Logo must be a PNG, JPEG or WebP image"));
  },
});

module.exports = {
  uploadBlogImage,
  uploadLogo,
};
