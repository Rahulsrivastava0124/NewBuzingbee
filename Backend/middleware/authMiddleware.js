const jwt = require("jsonwebtoken");
const { getJwtSecret } = require("../config");

const protectAdmin = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(
      token,
      getJwtSecret(),
    );

    req.admin = {
      id: decoded.id,
      username: decoded.username,
    };

    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

module.exports = {
  protectAdmin,
};
