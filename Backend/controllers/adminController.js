const crypto = require("crypto");
const Admin = require("../models/Admin");
const { ROLES, SUPER_EMAIL } = Admin;
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
    const { username, email, password, role, showBills } = req.body;

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

    // Only "admin" / "team" are assignable; the "super" role is reserved
    // for the pinned SUPER_EMAIL and gets set by the model's pre-save hook
    const assignedRole = role === "team" ? "team" : "admin";

    const admin = await Admin.create({
      username,
      email,
      password,
      role: assignedRole,
      showBills: showBills !== false,
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

    // Bootstrap: ensure the designated super admin keeps that role even on an
    // existing account that pre-dates the role column
    if (admin.email === SUPER_EMAIL && admin.role !== "super") {
      admin.role = "super";
      await admin.save();
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
    const { username, email, currentPassword, newPassword, confirmPassword, otp } =
      req.body;
    const admin = await Admin.findById(req.admin.id).select(
      "+passwordOtp +passwordOtpExpires +passwordOtpAttempts",
    );

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

      const otpError = await checkPasswordOtp(admin, otp);
      if (otpError) {
        return res.status(otpError.status).json({ success: false, message: otpError.message });
      }

      admin.password = newPassword;
      admin.passwordOtp = undefined;
      admin.passwordOtpExpires = undefined;
      admin.passwordOtpAttempts = 0;
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

// Team members (used by the "managed by" dropdown AND the user-management page)
const listAdmins = async (_req, res) => {
  try {
    const admins = await Admin.find({}, "username email role showBills createdAt").sort({
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
    return res.json({ success: true, message: "User removed" });
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

// ── Password-change OTP (Settings → Change password) ─────────────────────

const PASSWORD_OTP_TTL_MS = 10 * 60 * 1000;
const PASSWORD_OTP_MAX_ATTEMPTS = 5;

const maskEmail = (email) => {
  const [user, domain] = String(email).split("@");
  return `${user.slice(0, 1)}${"*".repeat(Math.max(user.length - 1, 2))}@${domain}`;
};

// Returns null when the code is right, else { status, message }
const checkPasswordOtp = async (admin, otp) => {
  const code = String(otp || "").trim();
  if (!code) {
    return { status: 400, message: "Enter the verification code sent to your email" };
  }
  if (!admin.passwordOtp || !admin.passwordOtpExpires || admin.passwordOtpExpires < new Date()) {
    return { status: 400, message: "Verification code expired. Request a new one." };
  }
  if ((admin.passwordOtpAttempts || 0) >= PASSWORD_OTP_MAX_ATTEMPTS) {
    return { status: 429, message: "Too many wrong codes. Request a new one." };
  }
  const expected = Buffer.from(admin.passwordOtp, "hex");
  const given = Buffer.from(hashToken(code), "hex");
  if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) {
    // updateOne so a failed attempt never saves other pending profile edits
    await Admin.updateOne({ _id: admin._id }, { $inc: { passwordOtpAttempts: 1 } });
    return { status: 400, message: "Incorrect verification code" };
  }
  return null;
};

const sendPasswordOtp = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id);
    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    const code = String(crypto.randomInt(0, 1000000)).padStart(6, "0");
    admin.passwordOtp = hashToken(code);
    admin.passwordOtpExpires = new Date(Date.now() + PASSWORD_OTP_TTL_MS);
    admin.passwordOtpAttempts = 0;
    await admin.save();

    const name = escapeHtml(admin.username);
    await sendMail({
      to: admin.email,
      subject: `${code} is your BuzingBee verification code`,
      text: [
        `Hi ${admin.username},`,
        "",
        `Your code to change your BuzingBee admin password is: ${code}`,
        "It expires in 10 minutes.",
        "",
        "If you did not ask to change your password, ignore this email and consider changing it.",
      ].join("\n"),
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#09090b">
          <h2 style="margin:0 0 12px">Confirm your password change</h2>
          <p>Hi ${name},</p>
          <p>Use this code to change your BuzingBee admin password. It expires in 10 minutes.</p>
          <p style="font-size:32px;font-weight:bold;letter-spacing:8px;margin:24px 0">${code}</p>
          <p style="color:#71717a;font-size:13px">If you did not ask to change your password, ignore this email.</p>
        </div>`,
    });

    return res.json({
      success: true,
      message: `Verification code sent to ${maskEmail(admin.email)}`,
    });
  } catch (error) {
    console.error("[password-otp]", error.message);
    return res
      .status(502)
      .json({ success: false, message: "Could not send the verification email. Try again." });
  }
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
  updateAdminRole,
  deleteAdmin,
  sendPasswordOtp,
};
