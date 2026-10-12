// Central environment handling. Production fails fast on unsafe configuration;
// development keeps working with clearly-logged fallbacks.
const isProduction = process.env.NODE_ENV === "production";

const DEV_JWT_SECRET = "dev-only-insecure-jwt-secret";
const MIN_JWT_SECRET_LENGTH = 32;

const getJwtSecret = () => process.env.JWT_SECRET || DEV_JWT_SECRET;

const parseList = (value) =>
  String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

// Returns the problems found; the caller decides whether to abort.
const validateEnv = () => {
  const errors = [];
  const warnings = [];

  if (!process.env.MONGO_URI) {
    (isProduction ? errors : warnings).push(
      "MONGO_URI is not set (falling back to a local MongoDB)",
    );
  }

  const secret = process.env.JWT_SECRET || "";
  if (!secret) {
    (isProduction ? errors : warnings).push(
      "JWT_SECRET is not set (using an insecure development secret)",
    );
  } else if (isProduction && secret.length < MIN_JWT_SECRET_LENGTH) {
    errors.push(
      `JWT_SECRET must be at least ${MIN_JWT_SECRET_LENGTH} characters in production`,
    );
  }

  if (isProduction && parseList(process.env.CORS_ORIGINS).length === 0) {
    warnings.push(
      "CORS_ORIGINS is not set: every origin is allowed. Set it to your site and admin URLs.",
    );
  }

  return { errors, warnings };
};

module.exports = {
  isProduction,
  getJwtSecret,
  parseList,
  validateEnv,
};
