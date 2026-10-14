const mongoose = require("mongoose");
const AuditLog = require("../models/AuditLog");

const ACTION_BY_METHOD = {
  POST: "create",
  PUT: "update",
  PATCH: "update",
  DELETE: "delete",
};

const OBJECT_ID_RE = /^[a-f0-9]{24}$/i;

const clientIp = (req) =>
  req.ip || req.socket?.remoteAddress || "";

// Splits "/api/finance/invoices/<id>/payments" into a resource label and the id.
const describePath = (url) => {
  const clean = String(url).split("?")[0].replace(/^\/api\//, "");
  const parts = clean.split("/").filter(Boolean);
  const id = parts.find((p) => OBJECT_ID_RE.test(p)) || "";
  const resource = parts.filter((p) => !OBJECT_ID_RE.test(p)).join("/");
  return { resource, resourceId: id };
};

const record = (entry) => {
  // Never let logging break or slow down a request
  if (mongoose.connection.readyState !== 1) return;
  AuditLog.create(entry).catch((error) => {
    console.error("[audit] could not write entry:", error.message);
  });
};

// Logs every state-changing request made by a signed-in admin.
const auditTrail = (req, res, next) => {
  if (!ACTION_BY_METHOD[req.method]) return next();

  res.on("finish", () => {
    if (!req.admin?.id) return;
    const { resource, resourceId } = describePath(req.originalUrl);
    record({
      admin: req.admin.id,
      username: req.admin.username || "",
      action: ACTION_BY_METHOD[req.method],
      method: req.method,
      path: String(req.originalUrl).split("?")[0],
      resource,
      resourceId,
      status: res.statusCode,
      success: res.statusCode < 400,
      ip: clientIp(req),
      userAgent: String(req.headers["user-agent"] || "").slice(0, 200),
    });
  });

  return next();
};

// Explicit entries for authentication events (no signed-in admin yet).
const logAuthEvent = (req, { action, username, admin, success }) =>
  record({
    admin: admin || null,
    username: String(username || "").slice(0, 100),
    action,
    method: req.method,
    path: String(req.originalUrl).split("?")[0],
    resource: "admin/auth",
    status: success ? 200 : 401,
    success,
    ip: clientIp(req),
    userAgent: String(req.headers["user-agent"] || "").slice(0, 200),
  });

const listAuditLog = async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const query = {};
    if (req.query.username) query.username = String(req.query.username);
    if (req.query.action) query.action = String(req.query.action);
    if (req.query.success === "false") query.success = false;

    const [entries, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(query),
    ]);
    return res.json({ success: true, total, page, limit, entries });
  } catch (_error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to load the activity log" });
  }
};

module.exports = { auditTrail, logAuthEvent, listAuditLog };
