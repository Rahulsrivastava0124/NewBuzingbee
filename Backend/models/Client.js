const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    company: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, lowercase: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    address: { type: String, trim: true, default: "" },
    gstin: { type: String, trim: true, uppercase: true, default: "" },
    notes: { type: String, default: "" },
    // Team member (admin account) responsible for this client
    managedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
      index: true,
    },
  },
  { timestamps: true },
);

clientSchema.index({ name: "text", company: "text", email: "text" });

module.exports = mongoose.model("Client", clientSchema);
