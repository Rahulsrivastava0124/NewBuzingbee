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
  },
  { timestamps: true },
);

module.exports = mongoose.model("Expense", expenseSchema);
