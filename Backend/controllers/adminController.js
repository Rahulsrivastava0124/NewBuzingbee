const Admin = require("../models/Admin");
const jwt = require("jsonwebtoken");

const generateToken = (admin) => {
  return jwt.sign(
    {
      id: admin._id,
      username: admin.username,
    },
    process.env.JWT_SECRET || "change-me-jwt-secret",
    { expiresIn: "1d" },
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
    const { username, email } = req.body;
    const admin = await Admin.findById(req.admin.id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    if (username) admin.username = username;
    if (email) admin.email = email.toLowerCase();

    await admin.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated",
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
