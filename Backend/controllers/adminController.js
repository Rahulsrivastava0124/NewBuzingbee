const Admin = require("../models/Admin");
const jwt = require("jsonwebtoken");

const generateToken = (admin) => {
  return jwt.sign(
    {
      id: admin._id,
      username: admin.username,
    },
    process.env.JWT_SECRET || "change-me-jwt-secret",
    { expiresIn: "10d" },
  );
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

    const token = generateToken(admin);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
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

module.exports = {
  adminRegister,
  adminLogin,
  getAdminProfile,
  updateAdminProfile,
};
