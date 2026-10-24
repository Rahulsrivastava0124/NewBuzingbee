const mongoose = require("mongoose");

// Money the super admin pays into someone's expense wallet (an advance or a
// reimbursement). Mirrored as a debit in the company wallet.
const expensePayoutSchema = new mongoose.Schema(
  {
    to: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true, index: true },
    amount: { type: Number, required: true, min: 0.01 },
    method: {
      type: String,
      enum: ["upi", "bank-transfer", "cash", "card", "cheque", "other"],
      default: "upi",
    },
    paidAt: { type: Date, default: Date.now },
    note: { type: String, default: "" },
    paidBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
  },
  { timestamps: true },
);

module.exports = mongoose.model("ExpensePayout", expensePayoutSchema);
