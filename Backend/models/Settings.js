const mongoose = require("mongoose");

// Single document (key: "main") holding company details and SMTP settings.
const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: "main", unique: true },
    company: {
      name: { type: String, trim: true, default: "" },
      legalName: { type: String, trim: true, default: "" },
      email: { type: String, trim: true, lowercase: true, default: "" },
      phone: { type: String, trim: true, default: "" },
      website: { type: String, trim: true, default: "" },
      address: { type: String, trim: true, default: "" },
      city: { type: String, trim: true, default: "" },
      state: { type: String, trim: true, default: "" },
      postalCode: { type: String, trim: true, default: "" },
      country: { type: String, trim: true, default: "India" },
      gstin: { type: String, trim: true, uppercase: true, default: "" },
      pan: { type: String, trim: true, uppercase: true, default: "" },
      logoUrl: { type: String, trim: true, default: "" },
      invoiceFooter: { type: String, default: "" },
    },
    smtp: {
      host: { type: String, trim: true, default: "" },
      port: { type: Number, default: undefined },
      secure: { type: Boolean, default: undefined },
      user: { type: String, trim: true, default: "" },
      // AES-256-GCM payload (iv.tag.data); never returned by the API
      passEncrypted: { type: String, default: "", select: false },
      from: { type: String, trim: true, default: "" },
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Settings", settingsSchema);
