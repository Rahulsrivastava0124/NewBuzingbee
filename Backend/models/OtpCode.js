const mongoose = require("mongoose");

// One-time codes sent over WhatsApp to verify an enquiry phone number.
// Only an HMAC of the code is stored; MongoDB deletes the row once it expires.
const otpCodeSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, index: true },
    codeHash: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true },
);

module.exports = mongoose.model("OtpCode", otpCodeSchema);
