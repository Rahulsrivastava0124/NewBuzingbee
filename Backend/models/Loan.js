const mongoose = require("mongoose");

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

const METHODS = ["upi", "bank-transfer", "cash", "card", "cheque", "other"];

const repaymentSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true, min: 0.01 },
    paidAt: { type: Date, default: Date.now },
    method: { type: String, enum: METHODS, default: "bank-transfer" },
    note: { type: String, trim: true, default: "" },
  },
  { timestamps: true },
);

// taken: we borrowed (money in, repayments go out)
// given: we lent (money out, repayments come back)
const loanSchema = new mongoose.Schema(
  {
    direction: { type: String, enum: ["taken", "given"], required: true },
    party: { type: String, required: true, trim: true },
    principal: { type: Number, required: true, min: 0.01 },
    startDate: { type: Date, default: Date.now },
    dueDate: { type: Date, default: null },
    method: { type: String, enum: METHODS, default: "bank-transfer" },
    note: { type: String, trim: true, default: "" },
    repayments: { type: [repaymentSchema], default: [] },
  },
  { timestamps: true },
);

loanSchema.virtual("repaid").get(function () {
  return round2(this.repayments.reduce((s, r) => s + r.amount, 0));
});

loanSchema.virtual("balance").get(function () {
  return round2(Math.max(this.principal - this.repaid, 0));
});

loanSchema.virtual("status").get(function () {
  return this.balance <= 0 ? "closed" : "open";
});

loanSchema.set("toJSON", { virtuals: true });
loanSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Loan", loanSchema);
module.exports.round2 = round2;
