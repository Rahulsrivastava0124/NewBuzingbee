const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const { getJwtSecret } = require("../config");

// A token proves a past login, not that the account still exists or still has
// the same role. Load the admin from the database, caching the answer briefly
// so each request does not hit MongoDB. Call forgetAdmin(id) after deleting an
// admin or changing their role/bill access so it takes effect immediately.
const CACHE_TTL_MS = 60 * 1000;
const adminCache = new Map();

const loadAdmin = async (id) => {
  const cached = adminCache.get(id);
  if (cached && cached.until > Date.now()) return cached.admin;

  const doc = await Admin.findById(id).select("role username email showBills");
  let admin = null;
  if (doc) {
    // Accounts that pre-date the role column (or are already signed in) get
    // the pinned super role here, not only at login
    if (doc.email === Admin.SUPER_EMAIL && doc.role !== "super") {
      await Admin.updateOne({ _id: doc._id }, { role: "super" });
      doc.role = "super";
    }
    admin = {
      id: String(doc._id),
      username: doc.username,
      role: doc.role,
      showBills: doc.role === "super" || doc.showBills !== false,
    };
  }
  adminCache.set(id, { admin, until: Date.now() + CACHE_TTL_MS });
  if (adminCache.size > 500) adminCache.clear();
  return admin;
};

const readToken = (req) => {
  const header = req.headers.authorization || "";
  return header.startsWith("Bearer ") ? header.split(" ")[1] : "";
};

const unauthorized = (res, message = "Unauthorized") =>
  res.status(401).json({ success: false, message });

const protectAdmin = async (req, res, next) => {
  const token = readToken(req);
  if (!token) return unauthorized(res);

  try {
    const decoded = jwt.verify(token, getJwtSecret(), {
      algorithms: ["HS256"],
    });

    const admin = decoded?.id ? await loadAdmin(String(decoded.id)) : null;
    if (!admin) return unauthorized(res, "Invalid or expired token");

    req.admin = admin;
    return next();
  } catch (_error) {
    return unauthorized(res, "Invalid or expired token");
  }
};

// For public endpoints that show more to a signed-in admin (e.g. drafts).
// An invalid or missing token simply means "anonymous".
const optionalAdmin = async (req, _res, next) => {
  const token = readToken(req);
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, getJwtSecret(), {
      algorithms: ["HS256"],
    });
    const admin = decoded?.id ? await loadAdmin(String(decoded.id)) : null;
    if (admin) req.admin = admin;
  } catch (_error) {
    // anonymous
  }
  return next();
};

// Call after deleting an admin or changing their role/bill access.
const forgetAdmin = (id) => adminCache.delete(String(id));

const requireRole = (...roles) => (req, res, next) => {
  if (!req.admin || !roles.includes(req.admin.role)) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }
  return next();
};

const requireBills = (req, res, next) => {
  if (!req.admin?.showBills) {
    return res.status(403).json({ success: false, message: "You don't have access to bills" });
  }
  return next();
};

module.exports = {
  protectAdmin,
  optionalAdmin,
  forgetAdmin,
  requireRole,
  requireSuper: requireRole("super"),
  requireBills,
};
