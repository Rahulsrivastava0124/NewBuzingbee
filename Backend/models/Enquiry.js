const mongoose = require("mongoose");

const enquirySchema = new mongoose.Schema(
  {
    // Which website the enquiry came from
    site: {
      type: String,
      enum: ["buzingbee", "hustlershive"],
      default: "buzingbee",
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    service: {
      type: String,
      trim: true,
      default: "",
    },
    budget: {
      type: String,
      trim: true,
      default: "",
    },
    // Required by the website form (checked there); not enforced here so any
    // enquiry without one can still be updated
    message: {
      type: String,
      default: "",
    },
    source: {
      type: String,
      trim: true,
      default: "contact-form",
    },
    status: {
      type: String,
      enum: ["new", "read", "replied", "archived"],
      default: "new",
    },
    adminNotes: {
      type: String,
      default: "",
    },
    ip: {
      type: String,
      default: "",
    },
    // WhatsApp OTP check on the phone number. Every lead is saved; only those
    // whose visitor entered the code are verified.
    phoneVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    phoneVerifiedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Enquiry", enquirySchema);
