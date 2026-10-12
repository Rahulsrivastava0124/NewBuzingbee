const crypto = require("crypto");

// Encrypts small secrets (the SMTP password) before they are stored in MongoDB.
// Key: SETTINGS_ENCRYPTION_KEY, falling back to JWT_SECRET. If the key changes
// the stored value can no longer be read and must be entered again.
const getKey = () => {
  const source =
    process.env.SETTINGS_ENCRYPTION_KEY ||
    process.env.JWT_SECRET ||
    "dev-only-insecure-jwt-secret";
  return crypto.createHash("sha256").update(String(source)).digest();
};

const encrypt = (plain) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const data = Buffer.concat([cipher.update(String(plain), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, data].map((b) => b.toString("base64")).join(".");
};

// Returns "" when the payload is empty, corrupted or encrypted with another key.
const decrypt = (payload) => {
  if (!payload) return "";
  try {
    const [iv, tag, data] = payload.split(".").map((p) => Buffer.from(p, "base64"));
    const decipher = crypto.createDecipheriv("aes-256-gcm", getKey(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
  } catch {
    return "";
  }
};

module.exports = { encrypt, decrypt };
