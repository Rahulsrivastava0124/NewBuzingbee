const mongoose = require("mongoose");

const analyticsSchema = new mongoose.Schema(
  {
    website: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    page: {
      type: String,
      required: true,
      trim: true,
    },
    device: {
      type: String,
      enum: ["mobile", "tablet", "desktop", "other"],
      default: "other",
    },
    location: {
      type: String,
      trim: true,
      default: "",
    },
    ipAddress: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    eventDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

// Compound index for faster duplicate checking
analyticsSchema.index({ website: 1, page: 1, ipAddress: 1, eventDate: -1 });

module.exports = mongoose.model("Analytics", analyticsSchema);
