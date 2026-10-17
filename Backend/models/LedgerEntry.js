const mongoose = require("mongoose");

// Single wallet ledger. Balance = sum(credit) - sum(debit).
// Entries created from payments/expenses carry refType + refId so they stay in sync.
const ledgerEntrySchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["credit", "debit"], required: true },
    amount: { type: Number, required: true, min: 0.01 },
    description: { type: String, required: true, trim: true },
    category: { type: String, trim: true, default: "general" },
    refType: {
      type: String,
      enum: ["payment", "expense", "manual", "loan", "loan-repayment"],
      default: "manual",
    },
    refId: { type: mongoose.Schema.Types.ObjectId, default: null },
    date: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true },
);

ledgerEntrySchema.index({ refType: 1, refId: 1 });

module.exports = mongoose.model("LedgerEntry", ledgerEntrySchema);
