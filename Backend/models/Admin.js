const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

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
    password: {
      type: String,
      required: true,
      minlength: 8,
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
    // SHA-256 of the emailed token; the token itself is never stored
    resetPasswordToken: { type: String, select: false, default: undefined },
    resetPasswordExpires: { type: Date, select: false, default: undefined },
    // Emailed code required to change the password from Settings (SHA-256 only)
    passwordOtp: { type: String, select: false, default: undefined },
    passwordOtpExpires: { type: Date, select: false, default: undefined },
    passwordOtpAttempts: { type: Number, select: false, default: 0 },
    // Sign-ins issued before this are rejected, so changing or resetting the
    // password ends every other session
    passwordChangedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  },
);

adminSchema.pre("save", async function () {
  // Pin super admin to the designated email, no matter what role was passed in
  if (this.email === SUPER_EMAIL) this.role = "super";

  if (!this.isModified("password")) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 12);
  // A second back so a token signed right after the change is still valid
  // (token times are whole seconds)
  if (!this.isNew) this.passwordChangedAt = new Date(Date.now() - 1000);
});

adminSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("Admin", adminSchema);
module.exports.ROLES = ROLES;
module.exports.SERVICES = SERVICES;
module.exports.SUPER_EMAIL = SUPER_EMAIL;
