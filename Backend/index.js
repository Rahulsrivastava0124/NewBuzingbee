const path = require("path");
// Load .env before any module reads process.env at require time
require("dotenv").config({ path: path.join(__dirname, ".env"), quiet: true });

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { isProduction, parseList, validateEnv } = require("./config");
const { connectionPromise } = require("./db.collection");
const adminRoutes = require("./routes/adminRoutes");
const blogRoutes = require("./routes/blogRoutes");
const caseStudyRoutes = require("./routes/caseStudyRoutes");
const enquiryRoutes = require("./routes/enquiryRoutes");
const healthRoutes = require("./routes/healthRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const financeRoutes = require("./routes/financeRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const { loadSmtpIntoMailer } = require("./controllers/settingsController");
const { autoPublishScheduledBlogs } = require("./controllers/blogController");
const { checkR2Connection } = require("./services/storageService");
const {
  checkSmtpConnection,
  logSmtpStatus,
} = require("./services/mailService");

// Refuse to start with an unsafe production configuration
const envCheck = validateEnv();
envCheck.warnings.forEach((message) => console.warn(`[config] ${message}`));
if (envCheck.errors.length) {
  envCheck.errors.forEach((message) => console.error(`[config] ${message}`));
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;
const BODY_SIZE_LIMIT = process.env.BODY_SIZE_LIMIT || "5mb";
const allowedOrigins = parseList(process.env.CORS_ORIGINS);

// Behind nginx / a load balancer, trust the first proxy so req.ip and the
// rate limiters see the real client address.
if (process.env.TRUST_PROXY) {
  const value = Number(process.env.TRUST_PROXY);
  app.set("trust proxy", Number.isNaN(value) ? process.env.TRUST_PROXY : value);
}

// Middleware
app.disable("x-powered-by");
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(
  cors(
    allowedOrigins.length
      ? {
          origin: (origin, callback) => {
            // Non-browser clients (curl, server-to-server) send no Origin
            if (!origin || allowedOrigins.includes(origin)) {
              return callback(null, true);
            }
            return callback(null, false);
          },
        }
      : undefined,
  ),
);
app.use(express.json({ limit: BODY_SIZE_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: BODY_SIZE_LIMIT }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/admin", adminRoutes);
app.use("/api/blog", blogRoutes);
app.use("/api/case-studies", caseStudyRoutes);
app.use("/api/enquiries", enquiryRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/finance", financeRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/health", healthRoutes);

app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Not found" });
});

// Error handler: payload limits get a helpful message, everything else is
// logged server-side and returned without internal details in production.
app.use((err, _req, res, _next) => {
  if (err?.type === "entity.too.large" || err?.status === 413) {
    return res.status(413).json({
      success: false,
      message:
        "Payload Too Large. Reduce content/image size or increase BODY_SIZE_LIMIT.",
    });
  }

  const status = err?.status >= 400 && err?.status < 600 ? err.status : 500;
  if (status >= 500) console.error("[error]", err);
  return res.status(status).json({
    success: false,
    message: status >= 500 ? "Internal server error" : err.message,
  });
});

const assignUnownedInvoices = async () => {
  const Admin = require("./models/Admin");
  const Invoice = require("./models/Invoice");
  const superAdmin = await Admin.findOne({ email: Admin.SUPER_EMAIL }, "_id");
  if (!superAdmin) return;
  const { modifiedCount } = await Invoice.updateMany(
    { billedBy: { $exists: false } },
    { $set: { billedBy: superAdmin._id } },
  );
  if (modifiedCount) console.log(`[invoices] Assigned ${modifiedCount} unowned invoice(s) to the super admin`);
};

let schedulerTimer = null;

const server = app.listen(PORT, () => {
  console.log(
    `Server is running on port ${PORT} (${isProduction ? "production" : "development"})`,
  );

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

// Express 5 passes listen errors to the callback as if they were success;
// handle them explicitly so a taken port cannot look like a healthy start.
server.on("error", (error) => {
  console.error(
    error.code === "EADDRINUSE"
      ? `Port ${PORT} is already in use`
      : `Server error: ${error.message}`,
  );
  process.exit(1);
});

// Start the scheduled blog publisher only after MongoDB is connected
connectionPromise
  .then(async () => {
    // SMTP settings saved in the admin panel override the environment
    try {
      await loadSmtpIntoMailer();
    } catch (error) {
      console.error("[SMTP] Could not load saved settings:", error.message);
    }
    checkSmtpConnection()
      .then(logSmtpStatus)
      .catch((error) => {
        console.error("[SMTP] Startup check failed", error.message);
      });

    autoPublishScheduledBlogs().catch((error) => {
      console.error("Error auto-publishing scheduled blogs on startup:", error);
    });

    // Bills created before invoices had an owner belong to the super admin
    assignUnownedInvoices().catch((error) => {
      console.error("[invoices] Could not assign unowned invoices:", error.message);
    });

    schedulerTimer = setInterval(() => {
      autoPublishScheduledBlogs().catch((error) => {
        console.error("Error auto-publishing scheduled blogs:", error);
      });
    }, 60000);
  })
  .catch((error) => {
    console.error("MongoDB unavailable:", error.message);
    if (isProduction) process.exit(1);
    console.error("Scheduler not started due to DB connection failure");
  });

// Graceful shutdown for process managers / containers
const shutdown = (signal) => {
  console.log(`${signal} received, shutting down`);
  if (schedulerTimer) clearInterval(schedulerTimer);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10000).unref();
};
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  console.error("[unhandledRejection]", reason);
});
