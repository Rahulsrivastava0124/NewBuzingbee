const mongoose = require("mongoose");

// Append-only trail of what admins did. Request bodies are never stored
// (they can contain passwords and tokens).
const auditLogSchema = new mongoose.Schema(
  {
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
    username: { type: String, default: "" },
    action: { type: String, required: true }, // e.g. "create", "update", "delete", "login"
    method: { type: String, default: "" },
    path: { type: String, default: "" },
    resource: { type: String, default: "" }, // e.g. "finance/invoices"
    resourceId: { type: String, default: "" },
    status: { type: Number, default: 0 },
    success: { type: Boolean, default: true },
    ip: { type: String, default: "" },
    userAgent: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { versionKey: false },
);

// Keep roughly six months of history
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 180 * 24 * 60 * 60 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
