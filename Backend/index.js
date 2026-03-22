const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
require("./db.collection");
const adminRoutes = require("./routes/adminRoutes");
const blogRoutes = require("./routes/blogRoutes");
const healthRoutes = require("./routes/healthRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const { autoPublishScheduledBlogs } = require("./controllers/blogController");
const { checkR2Connection } = require("./services/storageService");

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

  checkR2Connection()
    .then((status) => {
      if (status.connected) {
        console.log("[R2] Connected", {
          bucket: status.bucket,
          apiEndpoint: status.apiEndpoint,
          publicBaseUrl: status.publicBaseUrl,
        });
        return;
      }

      console.warn("[R2] Not ready", {
        bucket: status.bucket,
        apiEndpoint: status.apiEndpoint,
        publicBaseUrl: status.publicBaseUrl,
        missing: status.missing,
        code: status.code,
        message: status.message,
      });
    })
    .catch((error) => {
      console.error("[R2] Startup check failed", error.message);
    });
});

// Auto-publish scheduled blogs every minute
setInterval(() => {
  autoPublishScheduledBlogs().catch((error) => {
    console.error("Error auto-publishing scheduled blogs:", error);
  });
}, 60000); // 60000ms = 1 minute

// Run on server start
autoPublishScheduledBlogs().catch((error) => {
  console.error("Error auto-publishing scheduled blogs on startup:", error);
});
