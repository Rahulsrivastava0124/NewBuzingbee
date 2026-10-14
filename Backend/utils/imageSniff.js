// Identifies an image from its first bytes, ignoring whatever MIME type the
// client claimed. Returns "image/png" | "image/jpeg" | "image/webp" | "image/gif"
// or null when the content is not a recognised raster image.
const sniffImageType = (buffer) => {
  if (!buffer || buffer.length < 12) return null;

  const startsWith = (...bytes) => bytes.every((b, i) => buffer[i] === b);

  if (startsWith(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return "image/png";
  if (startsWith(0xff, 0xd8, 0xff)) return "image/jpeg";
  if (startsWith(0x47, 0x49, 0x46, 0x38)) return "image/gif";
  // RIFF....WEBP
  if (
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
};

module.exports = { sniffImageType };
