const jwt = require("jsonwebtoken");
const { getJwtSecret } = require("../config");
const Admin = require("../models/Admin");

const protectAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, getJwtSecret());

    // Role is read from the DB, not the token, so a role change takes effect
    // on the next request without forcing a re-login or a token rotation
    const admin = await Admin.findById(decoded.id).select("role username email showBills");
    if (!admin) {
      return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }

    // Accounts that pre-date the role column (or are already signed in) get
    // the pinned super role here, not only at login
    if (admin.email === Admin.SUPER_EMAIL && admin.role !== "super") {
      await Admin.updateOne({ _id: admin._id }, { role: "super" });
      admin.role = "super";
    }

    req.admin = {
      id: String(admin._id),
      username: admin.username,
      role: admin.role,
      showBills: admin.role === "super" || admin.showBills !== false,
    };

    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

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
  requireRole,
  requireSuper: requireRole("super"),
  requireBills,
};
