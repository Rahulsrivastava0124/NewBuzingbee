const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: [
        "software",
        "hosting",
        "marketing",
        "salary",
        "freelancer",
        "office",
        "travel",
        "tax",
        "other",
      ],
      default: "other",
    },
    amount: { type: Number, required: true, min: 0.01 },
    vendor: { type: String, trim: true, default: "" },
    method: {
      type: String,
      enum: ["upi", "bank-transfer", "cash", "card", "cheque", "other"],
      default: "bank-transfer",
    },
    spentAt: { type: Date, default: Date.now },
    note: { type: String, default: "" },
    // Whose expense wallet paid it; null = the company wallet (super admin, older entries)
    spentBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null, index: true },
    // Who entered it (may differ from the wallet, e.g. an admin logging a company expense)
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null, index: true },
    // Admin/team expenses wait for the super admin; only approved ones leave a wallet
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled"],
      default: "approved",
      index: true,
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Expense", expenseSchema);
// Entries from before approvals have no status and count as approved
module.exports.APPROVED = { status: { $nin: ["pending", "rejected", "cancelled"] } };
