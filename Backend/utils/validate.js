// Small input helpers shared by controllers that accept public or user data.

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const isPlainString = (value) => typeof value === "string";

// Removes HTML tags and control characters; collapses surrounding whitespace.
const plainText = (value) =>
  String(value)
    .replace(/<[^>]*>/g, "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Reads a string field and enforces type + length. Returns { value } or { error }.
const readText = (body, field, { max, required = false, label } = {}) => {
  const name = label || field;
  const raw = body?.[field];

  if (raw === undefined || raw === null || raw === "") {
    return required ? { error: `${name} is required` } : { value: "" };
  }
  if (!isPlainString(raw)) return { error: `${name} must be text` };

  const value = plainText(raw);
  if (required && !value) return { error: `${name} is required` };
  if (max && value.length > max) {
    return { error: `${name} must be ${max} characters or fewer` };
  }
  return { value };
};

module.exports = { escapeRegex, isPlainString, plainText, readText, EMAIL_RE };
