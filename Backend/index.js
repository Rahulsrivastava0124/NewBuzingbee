const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
require("dotenv").config();
require("./db.collection");
const adminRoutes = require("./routes/adminRoutes");
const blogRoutes = require("./routes/blogRoutes");
const healthRoutes = require("./routes/healthRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const { autoPublishScheduledBlogs } = require("./controllers/blogController");

const app = express();
const PORT = process.env.PORT || 3000;
const BODY_SIZE_LIMIT = process.env.BODY_SIZE_LIMIT || "5mb";

// Middleware
app.disable("x-powered-by");
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(cors());
app.use(express.json({ limit: BODY_SIZE_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: BODY_SIZE_LIMIT }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/admin", adminRoutes);
app.use("/api/blog", blogRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/health", healthRoutes);

// Handle oversized request payloads
app.use((err, _req, res, next) => {
  if (err?.type === "entity.too.large" || err?.status === 413) {
    return res.status(413).json({
      success: false,
      message:
        "Payload Too Large. Reduce content/image size or increase BODY_SIZE_LIMIT.",
    });
  }
  return next(err);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Auto publish scheduled blogs every minute
autoPublishScheduledBlogs().catch((error) => {
  console.error("Initial auto publish check error:", error.message);
});

setInterval(async () => {
  try {
    await autoPublishScheduledBlogs();
  } catch (error) {
    console.error("Auto publish scheduler error:", error.message);
  }
}, 60 * 1000);
