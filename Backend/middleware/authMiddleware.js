const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const { getJwtSecret } = require("../config");

// A token proves a past login, not that the account still exists. Confirm the
// admin is still in the database, caching the answer briefly so each request
// does not hit MongoDB.
const EXISTS_TTL_MS = 60 * 1000;
const existsCache = new Map();

const adminStillExists = async (id) => {
  const cached = existsCache.get(id);
  if (cached && cached.until > Date.now()) return cached.exists;

  const exists = Boolean(await Admin.exists({ _id: id }));
  existsCache.set(id, { exists, until: Date.now() + EXISTS_TTL_MS });
  if (existsCache.size > 500) existsCache.clear();
  return exists;
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

    if (!decoded?.id || !(await adminStillExists(String(decoded.id)))) {
      return unauthorized(res, "Invalid or expired token");
    }

    req.admin = { id: decoded.id, username: decoded.username };
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
    if (decoded?.id && (await adminStillExists(String(decoded.id)))) {
      req.admin = { id: decoded.id, username: decoded.username };
    }
  } catch (_error) {
    // anonymous
  }
  return next();
};

// Call after deleting an admin so access is cut off immediately.
const forgetAdmin = (id) => existsCache.delete(String(id));

module.exports = {
  protectAdmin,
  optionalAdmin,
  forgetAdmin,
};
