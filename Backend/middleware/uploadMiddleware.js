const multer = require("multer");
const { sniffImageType } = require("../utils/imageSniff");
const storage = multer.memoryStorage();

const rawBlogUpload = multer({
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

// The declared MIME type comes from the client and can be forged, so the file
// content itself must look like an image (PNG, JPEG, WebP or GIF).
const verifyImageContent = (req, res, next) => {
  if (!req.file) return next();
  const detected = sniffImageType(req.file.buffer);
  if (!detected) {
    return res.status(400).json({
      success: false,
      message: "The uploaded file is not a valid image",
    });
  }
  req.file.mimetype = detected;
  return next();
};

// Same API as multer: uploadBlogImage.single("image") -> [parse, verify]
const uploadBlogImage = {
  single: (field) => [
    // Turn multer's errors (wrong type, too large) into a clean 400
    (req, res, next) =>
      rawBlogUpload.single(field)(req, res, (error) => {
        if (!error) return next();
        return res.status(400).json({
          success: false,
          message:
            error.code === "LIMIT_FILE_SIZE"
              ? "Image must be 5 MB or smaller"
              : error.message,
        });
      }),
    verifyImageContent,
  ],
};

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
  verifyImageContent,
  uploadBlogImage,
  uploadLogo,
};
