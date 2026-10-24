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
  },
  { timestamps: true },
);

module.exports = mongoose.model("Expense", expenseSchema);
