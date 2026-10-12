const crypto = require("crypto");
const Admin = require("../models/Admin");
const { sendMail } = require("../services/mailService");
const jwt = require("jsonwebtoken");
const { getJwtSecret } = require("../config");

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
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Username, email, and password are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
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

    const admin = await Admin.create({
      username,
      email,
      password,
    });

    return res.status(201).json({
      success: true,
      message: "Admin registered successfully",
      data: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const adminLogin = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const loginId = (username || email || "").trim();

    if (!loginId || !password) {
      return res.status(400).json({
        success: false,
        message: "Username/email and password are required",
      });
    }

    const admin = await Admin.findOne({
      $or: [{ username: loginId }, { email: loginId.toLowerCase() }],
    });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    let isPasswordValid = await admin.matchPassword(password);

    // Backward compatibility for previously stored plaintext passwords
    if (!isPasswordValid && admin.password === password) {
      admin.password = password;
      await admin.save();
      isPasswordValid = true;
    }

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }

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
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id).select("-password");

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
    const { username, email, currentPassword, newPassword, confirmPassword } =
      req.body;
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
    let passwordChanged = false;

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

    const hasPasswordPayload =
      Boolean(currentPassword) ||
      Boolean(newPassword) ||
      Boolean(confirmPassword);

    if (hasPasswordPayload) {
      if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({
          success: false,
          message:
            "currentPassword, newPassword, and confirmPassword are required",
        });
      }

      if (String(newPassword).length < 8) {
        return res.status(400).json({
          success: false,
          message: "New password must be at least 8 characters",
        });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message: "New password and confirm password do not match",
        });
      }

      let isPasswordValid = await admin.matchPassword(currentPassword);

      // Backward compatibility for previously stored plaintext passwords
      if (!isPasswordValid && admin.password === currentPassword) {
        isPasswordValid = true;
      }

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Current password is incorrect",
        });
      }

      if (currentPassword === newPassword) {
        return res.status(400).json({
          success: false,
          message: "New password must be different from current password",
        });
      }

      admin.password = newPassword;
      passwordChanged = true;
    }

    if (!profileChanged && !passwordChanged) {
      return res.status(400).json({
        success: false,
        message: "No changes submitted",
      });
    }

    await admin.save();

    const message =
      profileChanged && passwordChanged
        ? "Profile and password updated"
        : passwordChanged
          ? "Password updated"
          : "Profile updated";

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

// Team members that a client can be assigned to ("managed by")
const listAdmins = async (_req, res) => {
  try {
    const admins = await Admin.find({}, "username email").sort({ username: 1 });
    return res.json({ success: true, admins });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── Forgot / reset password ───────────────────────────────────────────────

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[ch]);

const buildResetEmail = (admin, link) => {
  const name = escapeHtml(admin.username);
  const url = escapeHtml(link);
  return {
    subject: "Reset your BuzingBee admin password",
    text: [
      `Hi ${admin.username},`,
      "",
      "We received a request to reset your BuzingBee admin password.",
      `Open this link within 30 minutes to choose a new one:`,
      link,
      "",
      "If you did not ask for this, you can ignore this email; your password stays the same.",
    ].join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#0f172a">
        <h2 style="margin:0 0 12px">Reset your password</h2>
        <p>Hi ${name},</p>
        <p>We received a request to reset your BuzingBee admin password.
        This link works for 30 minutes and can be used once.</p>
        <p style="margin:24px 0">
          <a href="${url}" style="background:#f5a623;color:#0f172a;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">Choose a new password</a>
        </p>
        <p style="color:#64748b;font-size:13px">If the button does not work, paste this link into your browser:<br>${url}</p>
        <p style="color:#64748b;font-size:13px">If you did not request this, ignore this email. Your password stays the same.</p>
      </div>`,
  };
};

// Always answers the same way so the endpoint cannot be used to discover
// which usernames or emails belong to admins.
const GENERIC_FORGOT_RESPONSE = {
  success: true,
  message:
    "If an account matches, a password reset link has been sent to its email address.",
};

const forgotPassword = async (req, res) => {
  try {
    const identifier = String(req.body?.email || req.body?.username || "")
      .trim()
      .toLowerCase();

    if (!identifier) {
      return res
        .status(400)
        .json({ success: false, message: "Email or username is required" });
    }

    const admin = await Admin.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });

    if (admin) {
      const token = crypto.randomBytes(32).toString("hex");
      admin.resetPasswordToken = hashToken(token);
      admin.resetPasswordExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
      await admin.save();

      const base = (
        process.env.ADMIN_PANEL_URL || "http://localhost:5173"
      ).replace(/\/+$/, "");
      const link = `${base}/reset-password?token=${token}`;

      // Not awaited: response time must not reveal whether the account exists
      sendMail({ to: admin.email, ...buildResetEmail(admin, link) }).catch(
        (error) => {
          console.error("[forgot-password] email failed:", error.message);
        },
      );
    }

    return res.status(200).json(GENERIC_FORGOT_RESPONSE);
  } catch (error) {
    console.error("[forgot-password]", error);
    return res.status(200).json(GENERIC_FORGOT_RESPONSE);
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body || {};

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: "Reset token and new password are required",
      });
    }
    if (String(password).length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    const admin = await Admin.findOne({
      resetPasswordToken: hashToken(String(token)),
      resetPasswordExpires: { $gt: new Date() },
    }).select("+resetPasswordToken +resetPasswordExpires");

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "This reset link is invalid or has expired",
      });
    }

    admin.password = String(password);
    admin.resetPasswordToken = undefined;
    admin.resetPasswordExpires = undefined;
    await admin.save();

    return res
      .status(200)
      .json({ success: true, message: "Password updated. You can sign in now." });
  } catch (error) {
    console.error("[reset-password]", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  adminRegister,
  adminLogin,
  getAdminProfile,
  updateAdminProfile,
  forgotPassword,
  resetPassword,
  listAdmins,
};
