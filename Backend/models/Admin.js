const mongoose = require("mongoose");

const ROLES = ["super", "admin", "team"];
const SUPER_EMAIL = "team@buzingbee.com";
// Services a user handles; same keys as the website's enquiry forms
const SERVICES = [
  "web-development",
  "mobile-app",
  "ai-ml",
  "seo",
  "social-media",
  "ppc",
  "email-marketing",
  "branding",
  "ecommerce",
];

const adminSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    role: {
      type: String,
      enum: ROLES,
      default: "admin",
      index: true,
    },
    phone: { type: String, trim: true, default: "" },
    services: { type: [{ type: String, enum: SERVICES }], default: [] },
    // Super admin decides who can see bills (the whole Finance section)
    showBills: { type: Boolean, default: true },
    // Printed on invoices for this admin's personal clients
    payment: {
      bankAccountName: { type: String, trim: true, default: "" },
      bankName: { type: String, trim: true, default: "" },
      bankAccountNumber: { type: String, trim: true, default: "" },
      bankIfsc: { type: String, trim: true, uppercase: true, default: "" },
      upiId: { type: String, trim: true, lowercase: true, default: "" },
    },
    // Sign-ins issued before this are rejected (sign-in is by WhatsApp or email
    // code only; there are no passwords). Name kept for existing records.
    passwordChangedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  },
);

adminSchema.pre("save", function () {
  // Pin super admin to the designated email, no matter what role was passed in
  if (this.email === SUPER_EMAIL) this.role = "super";
});

module.exports = mongoose.model("Admin", adminSchema);
module.exports.ROLES = ROLES;
module.exports.SERVICES = SERVICES;
module.exports.SUPER_EMAIL = SUPER_EMAIL;
