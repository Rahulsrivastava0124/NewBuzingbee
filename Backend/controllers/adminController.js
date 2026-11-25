const Admin = require("../models/Admin");
const { ROLES, SUPER_EMAIL, SERVICES } = Admin;

// Optional phone: digits with an optional leading +, spaces/dashes allowed (7-15 digits)
const cleanPhone = (value) => String(value ?? "").trim();
const isValidPhone = (phone) => {
  if (phone === "") return true;
  const digits = phone.replace(/\D/g, "").length;
  return /^\+?[\d\s-]+$/.test(phone) && digits >= 7 && digits <= 15;
};
// null when the list has an unknown service
const cleanServices = (value) => {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.some((s) => !SERVICES.includes(s))) return null;
  return [...new Set(value)];
};
const { sendMail } = require("../services/mailService");
const jwt = require("jsonwebtoken");
const { getJwtSecret } = require("../config");
const { logAuthEvent } = require("../middleware/auditLog");
const { forgetAdmin } = require("../middleware/authMiddleware");
const { PAYMENT_FIELDS, UPI_RE } = require("../utils/payment");

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "10d";

const generateToken = (admin) => {
  const token = jwt.sign(
    {
      id: admin._id,
      username: admin.username,
    },
    getJwtSecret(),
    { expiresIn: JWT_EXPIRES_IN },
  );

  const decoded = jwt.decode(token);
  const expiresAt = decoded?.exp ? Number(decoded.exp) * 1000 : null;

  return { token, expiresAt };
};

const adminRegister = async (req, res) => {
  try {
    const { username, email, role, showBills } = req.body;
    const phone = cleanPhone(req.body.phone);
    const services = cleanServices(req.body.services);
    if (!isValidPhone(phone)) {
      return res.status(400).json({ success: false, message: "Enter a valid phone number" });
    }
    if (!services) {
      return res.status(400).json({ success: false, message: "Unknown service selected" });
    }

    // Only a super admin may create new users — except during bootstrap when
    // no super exists yet (first install, or pre-role deployment), in which
    // case any authenticated admin may register team@buzingbee.com and get
    // the system going
    if (req.admin?.role !== "super") {
      const superExists = await Admin.exists({ role: "super" });
      if (superExists) {
        return res.status(403).json({ success: false, message: "Forbidden" });
      }
    }

    if (!username || !email) {
      return res.status(400).json({
        success: false,
        message: "Username and email are required",
      });
    }

    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({
        success: false,
        message: "Username can only contain letters, numbers, and underscore",
      });
    }

    const existingAdmin = await Admin.findOne({
      $or: [{ username }, { email: email.toLowerCase() }],
    });

    if (existingAdmin) {
      return res.status(409).json({
        success: false,
        message: "Username or email already exists",
      });
    }

    // Only "admin" / "team" are assignable; the "super" role is reserved
    // for the pinned SUPER_EMAIL and gets set by the model's pre-save hook
    const assignedRole = role === "team" ? "team" : "admin";

    const admin = await Admin.create({
      username,
      email,
      role: assignedRole,
      // Bill access is opt-in: the super admin turns it on per person
      showBills: showBills === true,
      phone,
      services,
    });

    return res.status(201).json({
      success: true,
      message: "Admin registered successfully",
      data: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Last step of every sign-in (WhatsApp or email code): keeps the super role
// pinned, enforces the role's portal, logs the event and issues the token
const finishLogin = async (req, res, admin) => {
  // Bootstrap: ensure the designated super admin keeps that role even on an
  // existing account that pre-dates the role column
  if (admin.email === SUPER_EMAIL && admin.role !== "super") {
    admin.role = "super";
    await admin.save();
  }

  // Each role signs in on its own subdomain (super./admin./team.). The panel
  // sends which one; an account may only sign in on its own role's portal.
  const { portal } = req.body;
  if (portal) {
    if (!ROLES.includes(portal)) {
      return res.status(400).json({ success: false, message: "Unknown sign-in portal" });
    }
    const role = admin.role || "admin";
    if (role !== portal) {
      logAuthEvent(req, {
        action: "login_failed",
        username: admin.username,
        admin: admin._id,
        success: false,
      });
      return res.status(403).json({
        success: false,
        message: `This account can't sign in here. Use the ${role} portal: ${portalUrl(role)}`,
      });
    }
  }

  logAuthEvent(req, {
    action: "login",
    username: admin.username,
    admin: admin._id,
    success: true,
  });

  const { token, expiresAt } = generateToken(admin);

  return res.status(200).json({
    success: true,
    message: "Login successful",
    token,
    expiresAt,
    data: {
      id: admin._id,
      username: admin.username,
      email: admin.email,
      role: admin.role,
    },
  });
};

const getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id).select(
      "username email phone services role showBills payment createdAt updatedAt",
    );

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    return res.status(200).json({
      success: true,
      admin,
    });
  } catch (_error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const updateAdminProfile = async (req, res) => {
  try {
    const { username, email } = req.body;
    const admin = await Admin.findById(req.admin.id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    const trimmedUsername = typeof username === "string" ? username.trim() : "";
    const trimmedEmail =
      typeof email === "string" ? email.trim().toLowerCase() : "";

    let profileChanged = false;

    if (trimmedUsername && !/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
      return res.status(400).json({
        success: false,
        message: "Username can only contain letters, numbers, and underscore",
      });
    }
    if (trimmedEmail && trimmedEmail !== admin.email) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        return res.status(400).json({ success: false, message: "Enter a valid email address" });
      }
      // The super role follows this address, so it can neither leave the
      // super admin nor be claimed by anyone else (same rule as editAdmin)
      if (admin.email === SUPER_EMAIL) {
        return res.status(400).json({ success: false, message: "The super admin's email is pinned" });
      }
      if (trimmedEmail === SUPER_EMAIL) {
        return res.status(400).json({ success: false, message: "That email is reserved" });
      }
    }

    if (trimmedUsername && trimmedUsername !== admin.username) {
      const existingUsername = await Admin.findOne({
        username: trimmedUsername,
        _id: { $ne: admin._id },
      });

      if (existingUsername) {
        return res.status(409).json({
          success: false,
          message: "Username already exists",
        });
      }

      admin.username = trimmedUsername;
      profileChanged = true;
    }

    if (trimmedEmail && trimmedEmail !== admin.email) {
      const existingEmail = await Admin.findOne({
        email: trimmedEmail,
        _id: { $ne: admin._id },
      });

      if (existingEmail) {
        return res.status(409).json({
          success: false,
          message: "Email already exists",
        });
      }

      admin.email = trimmedEmail;
      profileChanged = true;
    }

    if (!profileChanged) {
      return res.status(400).json({
        success: false,
        message: "No changes submitted",
      });
    }

    await admin.save();
    // Other sessions end; this one gets a fresh token below

    const message = "Profile updated";

    return res.status(200).json({
      success: true,
      message,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
      },
    });
  } catch (_error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Bank/UPI details for the signed-in admin's personal-client invoices
const updatePaymentDetails = async (req, res) => {
  try {
    const body = req.body || {};
    if (body.upiId && !UPI_RE.test(String(body.upiId).trim())) {
      return res.status(400).json({ success: false, message: "UPI ID must look like name@bank" });
    }
    const admin = await Admin.findById(req.admin.id);
    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }
    PAYMENT_FIELDS.forEach((field) => {
      if (body[field] !== undefined) admin.payment[field] = String(body[field]);
    });
    await admin.save();
    return res.json({ success: true, payment: admin.payment });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Team members (used by the "managed by" dropdown AND the user-management page)
const listAdmins = async (_req, res) => {
  try {
    const admins = await Admin.find({}, "username email phone services role showBills createdAt").sort({
      role: 1,
      username: 1,
    });
    return res.json({ success: true, admins });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Super admin edits another user's role and/or bill access
const updateAdminRole = async (req, res) => {
  try {
    const { role, showBills } = req.body || {};
    if (role !== undefined && (!ROLES.includes(role) || role === "super")) {
      return res
        .status(400)
        .json({ success: false, message: "Role must be 'admin' or 'team'" });
    }
    if (showBills !== undefined && typeof showBills !== "boolean") {
      return res.status(400).json({ success: false, message: "showBills must be true or false" });
    }
    if (role === undefined && showBills === undefined) {
      return res.status(400).json({ success: false, message: "No changes submitted" });
    }

    const admin = await Admin.findById(req.params.id);
    if (!admin) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    if (admin.email === SUPER_EMAIL) {
      return res
        .status(400)
        .json({ success: false, message: "The super admin's access is pinned" });
    }

    if (role !== undefined) admin.role = role;
    if (showBills !== undefined) admin.showBills = showBills;
    await admin.save();
    forgetAdmin(admin._id);
    return res.json({
      success: true,
      message: "User updated",
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        showBills: admin.showBills,
      },
    });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Edit a user's username / email / phone. Super admin: anyone (the super
// admin's own email stays pinned). Admin: only users with the "team" role.
const editAdmin = async (req, res) => {
  try {
    const { username, email, phone, services } = req.body || {};
    const admin = await Admin.findById(req.params.id);
    if (!admin) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    if (req.admin.role !== "super" && admin.role !== "team") {
      return res
        .status(403)
        .json({ success: false, message: "Admins can only edit team members" });
    }

    const nextUsername = username === undefined ? admin.username : String(username).trim();
    const nextEmail = email === undefined ? admin.email : String(email).trim().toLowerCase();

    if (!/^[a-zA-Z0-9_]+$/.test(nextUsername)) {
      return res.status(400).json({
        success: false,
        message: "Username can only contain letters, numbers, and underscore",
      });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
      return res.status(400).json({ success: false, message: "Enter a valid email address" });
    }
    if (admin.email === SUPER_EMAIL && nextEmail !== SUPER_EMAIL) {
      return res
        .status(400)
        .json({ success: false, message: "The super admin's email is pinned" });
    }
    if (nextEmail === SUPER_EMAIL && admin.email !== SUPER_EMAIL) {
      return res.status(400).json({ success: false, message: "That email is reserved" });
    }
    const nextPhone = phone === undefined ? admin.phone : cleanPhone(phone);
    if (!isValidPhone(nextPhone)) {
      return res.status(400).json({ success: false, message: "Enter a valid phone number" });
    }
    const nextServices = services === undefined ? admin.services : cleanServices(services);
    if (!nextServices) {
      return res.status(400).json({ success: false, message: "Unknown service selected" });
    }

    const taken = await Admin.exists({
      _id: { $ne: admin._id },
      $or: [{ username: nextUsername }, { email: nextEmail }],
    });
    if (taken) {
      return res
        .status(409)
        .json({ success: false, message: "Username or email already exists" });
    }

    admin.username = nextUsername;
    admin.email = nextEmail;
    admin.phone = nextPhone;
    admin.services = nextServices;
    await admin.save();
    forgetAdmin(admin._id);
    return res.json({
      success: true,
      message: "User updated",
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        phone: admin.phone,
        services: admin.services,
        role: admin.role,
        showBills: admin.showBills,
      },
    });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const deleteAdmin = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id);
    if (!admin) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    if (admin.email === SUPER_EMAIL) {
      return res
        .status(400)
        .json({ success: false, message: "The super admin cannot be deleted" });
    }
    if (String(admin._id) === String(req.admin.id)) {
      return res
        .status(400)
        .json({ success: false, message: "You cannot delete yourself" });
    }

    await admin.deleteOne();
    forgetAdmin(admin._id);
    return res.json({ success: true, message: "User removed" });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Panel URL for a role: ADMIN_PANEL_URL with its "admin." label swapped for
// the role, e.g. https://admin.buzingbee.com -> https://team.buzingbee.com.
// Emails always link to the live domain unless ADMIN_PANEL_URL overrides it
// (set it to http://localhost:5173 to get local links while developing).
const DEFAULT_PANEL_URL = "https://admin.buzingbee.com";
const portalUrl = (role) => {
  const base = (process.env.ADMIN_PANEL_URL || DEFAULT_PANEL_URL).replace(/\/+$/, "");
  try {
    const url = new URL(base);
    if (url.hostname.startsWith("admin.")) url.hostname = `${role}.${url.hostname.slice(6)}`;
    return url.origin;
  } catch {
    return base;
  }
};

module.exports = {
  adminRegister,
  getAdminProfile,
  updateAdminProfile,
  updatePaymentDetails,
  listAdmins,
  updateAdminRole,
  editAdmin,
  deleteAdmin,
  finishLogin,
};
